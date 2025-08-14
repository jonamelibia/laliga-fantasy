import streamlit as st
import pandas as pd
import plotly.express as px
import numpy as np

st.set_page_config(page_title="Dashboard Fantasy Liga Española", layout="wide")

# --- Sidebar con imagen ---
st.sidebar.image("https://fantasy.laliga.com/assets/images/logo_fantasy.png", use_container_width=True)

# --- Navbar negra con logo ---
logo_url = "https://assets.laliga.com/assets/logos/laliga-genuine/LALIGA_GENUINE_Moeve_RGB_positivo/LALIGA_GENUINE_Moeve_RGB_positivo.png"
st.markdown(f"""
    <header>
        <img src="{logo_url}" alt="Logo Fantasy">
    </header>
""", unsafe_allow_html=True)
 
# --- Leer CSV local ---
try:
    df = pd.read_csv("data/data_local.csv", sep=';', decimal='.')
except FileNotFoundError:
    st.warning("No se ha encontrado el CSV local. Guarda primero alguna jornada.")
    st.stop()

df["puntos"] = df["puntos"].astype(float)
df["multa"] = df["multa"].astype(float)

# --- Colores por jugador ---
jugadores = df["jugador"].unique()
colores_jugadores = ["#E30613", "#000000", "#555555", "#FF4500", "#1E90FF", "#32CD32"]
color_map = {jugador: colores_jugadores[i] for i, jugador in enumerate(jugadores)}

# --- KPIs por jugador ---

st.header("Puntuación total")
kpi_data = []
for jugador in jugadores:
    df_j = df[df["jugador"] == jugador]
    total_puntos = int(df_j["puntos"].sum())
    total_multas = df_j["multa"].sum()
    kpi_data.append({"jugador": jugador, "total_puntos": total_puntos, "total_multas": total_multas})

# Orden descendente por puntos
kpi_data = sorted(kpi_data, key=lambda x: x["total_puntos"], reverse=True)
kpi_cols = st.columns(len(jugadores))
for i, kpi in enumerate(kpi_data):
    kpi_cols[i].metric(
        label=kpi["jugador"],
        value=f"{kpi['total_puntos']} pts",
        delta=f"€{kpi['total_multas']:.2f}"
    )


# --- Clasificación ---
st.header("Clasificación general")
# Acumulado de puntos y número de jornadas por jugador
df_acum = df.groupby("jugador").agg(
    puntos_acumulados=("puntos", "sum"),
    multas_acumuladas=("multa", "sum"),
    jornadas=("num_jornada", "nunique")
).reset_index().sort_values(by="puntos_acumulados", ascending=False).reset_index(drop=True)  # Esto quita el índice original
df_acum["puntos_acumulados"] = df_acum["puntos_acumulados"].astype(int)
df_acum["multas_acumuladas"] = df_acum["multas_acumuladas"].astype(float).round(2).astype(str).str.replace('.', ',').add(" €")  # Formatear multas
df_acum.rename(columns={
    "jugador": "Jugador",
    "puntos_acumulados": "Puntos",
    "multas_acumuladas": "Multas",
    "jornadas": "Jornadas"
}, inplace=True)
# Mostrar en un recuadro con st.markdown
st.markdown('<div style="background-color:white; border-radius:10px; padding:10px;">', unsafe_allow_html=True)
st.table(df_acum)  # No aparecerá el índice
st.markdown('</div>', unsafe_allow_html=True)


# --- KPIs extra: mejor y peor jornada, media ---
st.header("KPIs de jornada")
df_grouped = df.groupby(["num_jornada", "jugador"])["puntos"].sum().reset_index()
mejor_j = df_grouped.loc[df_grouped["puntos"].idxmax()]
peor_j = df_grouped.loc[df_grouped["puntos"].idxmin()]
media_j = df_grouped.groupby("num_jornada")["puntos"].mean().reset_index()
desviacion_j = df_grouped.groupby("num_jornada")["puntos"].std().reset_index()

kpi1, kpi2, kpi3 = st.columns(3)
kpi1.metric("Mejor jornada", f"J{int(mejor_j['num_jornada'])} - {mejor_j['jugador']}", f"{mejor_j['puntos']} pts")
kpi2.metric("Peor jornada", f"J{int(peor_j['num_jornada'])} - {peor_j['jugador']}", f"{peor_j['puntos']} pts")
kpi3.metric("Promedio de puntos por jornada", f"{media_j['puntos'].mean():.2f} pts", f"±{desviacion_j['puntos'].mean():.2f}")

# --- Gráficas: filas y columnas ---
st.header("Evolución y acumulados detallados")

# Fila 1: Evolución de puntos y multas
row1_col1, row1_col2 = st.columns(2)
with row1_col1:
    fig_pts_evol = px.line(df, x="num_jornada", y="puntos", color="jugador", markers=True,
                           title="Evolución de puntos por jugador", color_discrete_map=color_map)
    fig_pts_evol.update_layout(plot_bgcolor="white", paper_bgcolor="white", font_color="#000000")
    st.plotly_chart(fig_pts_evol, use_container_width=True)

with row1_col2:
    df_multas_j = df.groupby(["num_jornada", "jugador"])["multa"].sum().reset_index()
    fig_multas_evol = px.line(df_multas_j, x="num_jornada", y="multa", color="jugador", markers=True,
                              title="Evolución de multas", color_discrete_map=color_map)
    fig_multas_evol.update_layout(plot_bgcolor="white", paper_bgcolor="white", font_color="#000000")
    st.plotly_chart(fig_multas_evol, use_container_width=True)

# Fila 2: Acumulado puntos y multas
row2_col1, row2_col2 = st.columns(2)
with row2_col1:
    df_acum_puntos = df.groupby("jugador")["puntos"].sum().reset_index().sort_values(by="puntos", ascending=False)
    fig_acum_puntos = px.bar(df_acum_puntos, x="jugador", y="puntos", text="puntos",
                             title="Acumulado de puntos", color="jugador", color_discrete_map=color_map)
    fig_acum_puntos.update_layout(plot_bgcolor="white", paper_bgcolor="white", font_color="#000000")
    st.plotly_chart(fig_acum_puntos, use_container_width=True)

with row2_col2:
    df_acum_multas = df.groupby("jugador")["multa"].sum().reset_index().sort_values(by="multa", ascending=False)
    fig_acum_multas = px.bar(df_acum_multas, x="jugador", y="multa", text="multa",
                             title="Acumulado de multas", color="jugador", color_discrete_map=color_map)
    fig_acum_multas.update_layout(plot_bgcolor="white", paper_bgcolor="white", font_color="#000000")
    st.plotly_chart(fig_acum_multas, use_container_width=True)

# Fila 3: Media puntos con desviación y distribución
# --- Última fila de gráficos ---
st.header("Distribución de puntos por jugador")

# Crear boxplot con Plotly Express
fig_box = px.box(
    df, x="jugador", y="puntos", points="all",  # "all" muestra todos los puntos individuales
    color="jugador", color_discrete_map=color_map,
    title="Distribución de puntos por jugador"
)
fig_box.update_layout(
    plot_bgcolor="white",
    paper_bgcolor="white",
    font_color="#000000"
)

# Mostrar la gráfica en la app
st.plotly_chart(fig_box, use_container_width=True)

