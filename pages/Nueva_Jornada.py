import streamlit as st
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pandas as pd
from datetime import datetime

from utils.auth import login_required, logout_button

# Autenticación obligatoria
login_required()
logout_button()

# --- Configuración Google Sheets usando st.secrets ---
# Debes crear en Streamlit Cloud un secreto llamado google_sheets
# con las claves necesarias: project_id, private_key, client_email, client_id, etc.
gs_config = st.secrets["google_sheets"]

credentials = {
    "type": "service_account",
    "project_id": gs_config["google_project_id"],
    "private_key_id": gs_config["google_private_key_id"],
    "private_key": gs_config["google_private_key"].replace("\\n", "\n"),
    "client_email": gs_config["google_client_email"],
    "client_id": gs_config["google_client_id"],
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{gs_config['google_client_email']}"
}

scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
creds = ServiceAccountCredentials.from_json_keyfile_dict(credentials, scope)
client = gspread.authorize(creds)

sheet = client.open_by_key(gs_config["google_spreadsheet_id"]).sheet1

# --- Lista de jugadores ---
jugadores = ['Ame FC', 'Mvg1712', 'Rakiticismo', 'Mariooon', 'Babin5', 'a|t0r']

# --- Funciones ---
def calcular_multas_y_posiciones(lista):
    ordenados = sorted(lista, key=lambda x: x["puntos"], reverse=True)
    resultados = []
    i = 0
    posicion_actual = 1

    while i < len(ordenados):
        empatados = [ordenados[i]]
        j = i + 1
        while j < len(ordenados) and ordenados[j]["puntos"] == ordenados[i]["puntos"]:
            empatados.append(ordenados[j])
            j += 1

        multa = multa_por_posicion(posicion_actual + len(empatados) - 1)

        for e in empatados:
            resultados.append({
                "jugador": e["jugador"],
                "puntos": e["puntos"],
                "posicion": posicion_actual,
                "multa": multa
            })

        posicion_actual += len(empatados)
        i = j

    return resultados

def multa_por_posicion(pos):
    if pos == 3: return "0.5"
    elif pos == 4: return 1
    elif pos == 5: return 2
    elif pos == 6: return 3
    else: return 0

def guardar_csv_local():
    datos_actualizados = sheet.get_all_records()
    df_final = pd.DataFrame(datos_actualizados)
    if not os.path.exists("data/"):
        os.makedirs("data/")
    df_final.to_csv("data/data_local.csv", index=False, decimal=".", float_format="%.2f", sep=";")
    st.toast("CSV local actualizado desde Google Sheets.", icon="💾")

# --- UI ---
st.title("Registro de Jornada - Fantasy Liga Española")

num_jornada = st.number_input("Número de Jornada", min_value=1, step=1)

puntos_jugadores = []
for j in jugadores:
    puntos = st.number_input(f"Puntos de {j}", min_value=0, step=1)
    puntos_jugadores.append({"jugador": j, "puntos": puntos})

if st.button("Guardar Jornada"):
    todas = sheet.get_all_records()
    if any(int(r["num_jornada"]) == num_jornada for r in todas):
        st.toast(f"La jornada {num_jornada} ya existe.", icon="⚠️")
    else:
        resultados = calcular_multas_y_posiciones(puntos_jugadores)
        fecha = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        for r in resultados:
            sheet.append_row([
                num_jornada,
                r["jugador"],
                r["puntos"],
                r["posicion"],
                r["multa"],
                fecha,
                st.session_state.user
            ])
        guardar_csv_local()
        st.toast(f"Jornada {num_jornada} guardada correctamente y copia local actualizada.", icon="✅")

if st.button("Actualizar CSV local desde Google Sheets"):
    guardar_csv_local()
