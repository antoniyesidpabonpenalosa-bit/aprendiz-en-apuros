#!/bin/bash
# Pruebas de db/sala-vivo.sql contra un Postgres local con el esquema de
# producción (records.sql, anti-trampas.sql, salas.sql, sala-vivo.sql) en la base
# "prueba". Hace de rol anon, como hace el juego por la API.
#   bash db/pruebas/sala-vivo.sh
anon(){ local o; o=$(su postgres -c "psql -d prueba -Atq -v ON_ERROR_STOP=1" 2>&1 <<SQL
begin; set local role anon;
$1;
commit;
SQL
); [ $? -eq 0 ] && echo "$o" || echo "$o" | grep -o "ERROR: .*" | tr -s " " | head -1; }
db(){ su postgres -c "psql -d prueba -Atq -c \"$1\""; }
n=0; mal=0
ok(){ n=$((n+1)); if [[ "$2" == *"$1"* ]]; then echo "✓ $3"; else echo "✗ $3 → esperaba '$1', salió '$2'"; mal=$((mal+1)); fi; }
jq_(){ python3 -c "import json,sys;d=json.loads(sys.argv[1]);print(eval(sys.argv[2]))" "$1" "$2"; }

C=$(anon "select sala_crear(1, array['quiz'])"); COD=$(jq_ "$C" "d['codigo']"); HT=$(jq_ "$C" "d['token']")
A=$(anon "select sala_unirse('$COD','ana',0,0,'',false)"); AID=$(jq_ "$A" "d['id']"); AT=$(jq_ "$A" "d['token']")
B=$(anon "select sala_unirse('$COD','beto',1,1,'',false)"); BID=$(jq_ "$B" "d['id']"); BT=$(jq_ "$B" "d['token']")
E=$(anon "select sala_estado('$COD')")
ok "ritmo" "$(jq_ "$E" "d['modo']")" "una sala nueva es de ritmo propio, como siempre"
ok "0" "$(jq_ "$E" "d['q_n']")" "sin pregunta en curso"

# ── mandos ──
ok "f" "$(anon "select sala_vivo('$COD','$AT','iniciar',array[3,8,1],20)")" "un alumno no puede iniciar la ronda en vivo"
ok "f" "$(anon "select sala_vivo('$COD','$HT','iniciar',null,20)")" "sin preguntas no inicia"
ok "f" "$(anon "select sala_vivo('$COD','$HT','iniciar',array[]::int[],20)")" "lista vacía no inicia"
ok "f" "$(anon "select sala_vivo('$COD','$HT','iniciar',array[1,2,3,4,5,6,7,8,9,10,11],20)")" "más de 10 preguntas no inicia"
ok "f" "$(anon "select sala_vivo('$COD','$HT','iniciar',array[1,2000],20)")" "un índice fuera de rango no inicia"
ok "f" "$(anon "select sala_vivo('$COD','$HT','iniciar',array[1,2],3)")" "menos de 5 s por pregunta no inicia"
ok "f" "$(anon "select sala_vivo('$COD','$HT','revelar')")" "no se revela lo que no empezó"
ok "t" "$(anon "select sala_vivo('$COD','$HT','iniciar',array[3,8,1],20)")" "el instructor inicia con 3 preguntas"
ok "f" "$(anon "select sala_vivo('$COD','$HT','iniciar',array[3,8,1],20)")" "no se puede iniciar dos veces"
E=$(anon "select sala_estado('$COD')")
ok "vivo jugando 1 3" "$(jq_ "$E" "d['modo']+' '+d['estado']+' '+str(d['q_n'])+' '+str(d['q_total'])")" "estado: vivo, jugando, pregunta 1 de 3"
ok "3 8 1" "$(jq_ "$E" "' '.join(map(str,d['items']))")" "todos leen las mismas preguntas"
ok "True" "$(jq_ "$E" "d['ms'] is not None and d['ms'] < 5000")" "el servidor dice cuánto lleva la pregunta"
ok "False" "$(jq_ "$E" "d['revelada']")" "aún sin revelar"
ok "False" "$(jq_ "$E" "'token' in str(d) or 'hash' in str(d)")" "el estado sigue sin filtrar tokens"

# ── responder ──
P1=$(anon "select sala_responder('$AID','$AT',1,2,true)")
[ "$P1" -ge 900 ] 2>/dev/null && [ "$P1" -le 1000 ] && ok "ok" "ok" "acertar de inmediato da de 900 a 1000 ($P1)" || ok "ok" "mal:$P1" "acertar de inmediato da de 900 a 1000"
ok "-1" "$(anon "select sala_responder('$AID','$AT',1,2,true)")" "no se puede responder dos veces la misma pregunta"
ok "-1" "$(anon "select sala_responder('$BID','$AT',1,2,true)")" "con el token de otro no se responde"
ok "-1" "$(anon "select sala_responder('$BID','$BT',2,1,true)")" "una pregunta que no es la actual se rechaza"
ok "-1" "$(anon "select sala_responder('$BID','$BT',1,9,true)")" "una opción fuera de rango se rechaza"
P2=$(anon "select sala_responder('$BID','$BT',1,0,false)")
ok "0" "$P2" "fallar da 0 puntos"
E=$(anon "select sala_estado('$COD')")
ok "2" "$(jq_ "$E" "d['respondieron']")" "el proyector ve que respondieron 2"
ok "ANA" "$(jq_ "$E" "d['jugadores'][0]['nombre']")" "la tabla pone primera a quien más puntos tiene"
ok "True" "$(jq_ "$E" "[j['ya'] for j in d['jugadores'] if j['nombre']=='ANA'][0]")" "se ve quién ya respondió"
ok "None" "$(jq_ "$E" "d['dist']")" "mientras no se revela, no hay distribución"

# ── revelar, y ya no se acepta más ──
ok "t" "$(anon "select sala_vivo('$COD','$HT','revelar')")" "el instructor revela"
E=$(anon "select sala_estado('$COD')")
ok "True" "$(jq_ "$E" "d['revelada']")" "revelada"
ok "1 0 1 0" "$(jq_ "$E" "' '.join(map(str,d['dist']))")" "la distribución cuenta una por opción elegida (la 0 y la 2)"
ok "id" "$(anon "select sala_unirse('$COD','tarde',0,0,'',false)")" "entrar con la ronda ya en marcha se puede: verá las preguntas que falten"

# ── siguiente, hasta el final ──
ok "t" "$(anon "select sala_vivo('$COD','$HT','siguiente')")" "pasa a la pregunta 2"
ok "2 False" "$(jq_ "$(anon "select sala_estado('$COD')")" "str(d['q_n'])+' '+str(d['revelada'])")" "pregunta 2, sin revelar"
ok "-1" "$(anon "select sala_responder('$AID','$AT',1,2,true)")" "la pregunta 1 ya pasó"
ok "0" "$(anon "select sala_responder('$AID','$AT',2,1,false)")" "responder la 2"
ok "t" "$(anon "select sala_vivo('$COD','$HT','siguiente')")" "pasa a la 3"
ok "t" "$(anon "select sala_vivo('$COD','$HT','siguiente')")" "tras la última…"
ok "fin" "$(jq_ "$(anon "select sala_estado('$COD')")" "d['estado']")" "…la sala termina sola"
ok "-1" "$(anon "select sala_responder('$AID','$AT',3,0,true)")" "y ya no se responde"

# ── fuera de tiempo: se adelanta el reloj de la pregunta en la base ──
C2=$(anon "select sala_crear(1, array['quiz'])"); COD2=$(jq_ "$C2" "d['codigo']"); HT2=$(jq_ "$C2" "d['token']")
D=$(anon "select sala_unirse('$COD2','dani',0,0,'',false)"); DID=$(jq_ "$D" "d['id']"); DT=$(jq_ "$D" "d['token']")
anon "select sala_vivo('$COD2','$HT2','iniciar',array[5],10)" >/dev/null
db "update privado.salas set q_inicio = now() - interval '5 seconds' where codigo='$COD2'" >/dev/null
P=$(anon "select sala_responder('$DID','$DT',1,1,true)")
ok "ok" "$([ "$P" -ge 600 ] && [ "$P" -le 700 ] && echo ok || echo "valor $P")" "a mitad del tiempo, ~650 puntos ($P)"
E2=$(anon "select sala_unirse('$COD2','eli',0,0,'',false)"); EID=$(jq_ "$E2" "d['id']"); ET=$(jq_ "$E2" "d['token']")
db "update privado.salas set q_inicio = now() - interval '30 seconds' where codigo='$COD2'" >/dev/null
ok "-1" "$(anon "select sala_responder('$EID','$ET',1,1,true)")" "pasado el tiempo (y el margen) se rechaza"
db "update privado.salas set q_inicio = now() - interval '11 seconds' where codigo='$COD2'" >/dev/null
P=$(anon "select sala_responder('$EID','$ET',1,1,true)")
ok "300" "$P" "justo en el margen de red, el mínimo son 300 ($P)"

# ── panel: reportar ──
ok "t" "$(anon "select sala_reportar('$AID','$AT',1,'[[\"quiz\",5,false],[\"quiz\",6,true],[\"git\",2,false]]'::jsonb)")" "un alumno reporta su ronda 1"
ok "f" "$(anon "select sala_reportar('$AID','$AT',1,'[[\"quiz\",5,false]]'::jsonb)")" "reportar la misma ronda otra vez no cuenta doble"
ok "f" "$(anon "select sala_reportar('$BID','$AT',1,'[[\"quiz\",5,false]]'::jsonb)")" "con el token de otro no se reporta"
ok "t" "$(anon "select sala_reportar('$BID','$BT',1,'[[\"quiz\",5,false],[\"quiz\",6,false],[\"hackear\",1,false],[\"quiz\",99999,false],[\"quiz\",7],\"x\"]'::jsonb)")" "lo mal formado se ignora sin tumbar el resto"
ok "f" "$(anon "select sala_reportar('$BID','$BT',9,'[]'::jsonb)")" "una ronda inexistente se rechaza"
LARGO=$(python3 -c "import json;print(json.dumps([['quiz',i,False] for i in range(41)]))")
ok "f" "$(anon "select sala_reportar('$BID','$BT',2,'$LARGO'::jsonb)")" "más de 40 elementos se rechaza"
R=$(anon "select sala_resumen('$COD')")
ok "quiz 5 2 2" "$(jq_ "$R" "' '.join(str(x) for x in [d['temas'][0]['tema'],d['temas'][0]['item'],d['temas'][0]['intentos'],d['temas'][0]['fallos']])")" "el ítem más fallado: quiz 5, 2 intentos, 2 fallos"
ok "False" "$(jq_ "$R" "any(t['tema']=='hackear' for t in d['temas'])")" "el tema inventado no entró"
ok "False" "$(jq_ "$R" "'nombre' in str(d) or 'id' in str(d.keys())")" "el resumen no lleva nombres de jugadores"
ok "None" "$(anon "select sala_resumen('ZZZZZ')" | sed 's/^$/None/')" "una sala inexistente devuelve nada"

# ── el panel también cuenta las preguntas de la ronda en vivo ──
ok "quiz 8" "$(jq_ "$(anon "select sala_resumen('$COD')")" "' '.join(str(x) for x in [[t for t in d['temas'] if t['item']==8][0]['tema'],[t for t in d['temas'] if t['item']==8][0]['item']])")" "los fallos de la ronda en vivo entran al panel (pregunta 8)"

# ── permisos ──
ok "ERROR" "$(anon "select count(*) from privado.sala_respuestas")" "anon no lee las respuestas"
ok "ERROR" "$(anon "select count(*) from privado.sala_resultados")" "ni los resultados"
ok "ERROR" "$(anon "insert into privado.sala_resultados values ('X','quiz',1,1,1)")" "ni escribe directo"
ok "ERROR" "$(anon "update privado.salas set modo='vivo'")" "ni cambia el modo de una sala"
ok "ERROR" "$(anon "select * from privado.huella('x')")" "la función interna sigue cerrada"

echo "── $((n-mal))/$n bien"
[ $mal -eq 0 ]
