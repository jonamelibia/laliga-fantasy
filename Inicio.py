import streamlit as st
import pandas as pd
import plotly.express as px
import numpy as np
from utils.get_gc_data import obtener_datos
from utils.styles import apply_custom_style

st.set_page_config(
    page_title="LALIGA Fantasy | Dashboard Premium", 
    layout="wide", 
    page_icon="⚽",
    initial_sidebar_state="collapsed"
)

# --- Apply Premium Style ---
apply_custom_style()

# --- Official LaLiga Palette ---
LALIGA_RED = "#ee2a24"
LALIGA_NAVY = "#1a1a1b"
STAT_COLORS = [LALIGA_RED, "#2977ff", "#00d1b2", "#ffb800", "#718096", "#ff5f1f"]

# --- Sidebar ---
st.sidebar.image("https://fantasy.laliga.com/assets/images/logo_fantasy.png", use_container_width=True)
st.sidebar.markdown("---")
if st.sidebar.button("🔄 Refrescar Datos"):
    st.session_state["refresh_data"] = True
    st.rerun()

# --- Leer Datos ---
try:
    df = obtener_datos(refresh=st.session_state.get("refresh_data", False))
    st.session_state["refresh_data"] = False
except FileNotFoundError:
    st.warning("No se ha encontrado el CSV local. Guarda primero alguna jornada.")
    st.stop()

df["puntos"] = df["puntos"].astype(float)
df["multa"] = df["multa"].astype(float)
max_j = df["num_jornada"].max()

# --- Pre-procesamiento para analíticas ---
# 1. Media para no pagar (puntos del 3º puesto en cada jornada)
def get_safety_threshold(d):
    # Ordenar por puntos desc en cada jornada y coger el 3º
    top_scores = d.sort_values("puntos", ascending=False)["puntos"].tolist()
    return top_scores[2] if len(top_scores) >= 3 else top_scores[-1]

safety_by_jornada = df.groupby("num_jornada").apply(get_safety_threshold).reset_index(name="safety_score")
media_no_pagar = safety_by_jornada["safety_score"].mean()

# --- Colors ---
jugadores = df["jugador"].unique()
color_map = {jugador: STAT_COLORS[i % len(STAT_COLORS)] for i, jugador in enumerate(jugadores)}

# --- Header ---
col_h1, col_h2 = st.columns([1, 10])
with col_h1:
    st.image("https://assets.laliga.com/assets/logos/laliga-genuine/LALIGA_GENUINE_Moeve_RGB_positivo/LALIGA_GENUINE_Moeve_RGB_positivo.png", width=80)
with col_h2:
    st.markdown(f'<h1>LALIGA FANTASY DASHBOARD <span class="matchday-badge">JORNADA {int(max_j)}</span></h1>', unsafe_allow_html=True)

# --- Top Players KPIs ---
st.markdown("### 🏟️ ESTADO DE LA LIGA")
kpi_data = []
for jugador in jugadores:
    df_j = df[df["jugador"] == jugador]
    kpi_data.append({
        "jugador": jugador, 
        "total_puntos": int(df_j["puntos"].sum()), 
        "total_multas": df_j["multa"].sum()
    })
kpi_data = sorted(kpi_data, key=lambda x: x["total_puntos"], reverse=True)

kpi_cols = st.columns(len(jugadores))
for i, kpi in enumerate(kpi_data):
    kpi_cols[i].metric(
        label=kpi["jugador"],
        value=f"{kpi['total_puntos']}",
        delta=f"-€{kpi['total_multas']:.2f}" if kpi['total_multas'] > 0 else "SAFE",
        delta_color="inverse"
    )

st.markdown("<br>", unsafe_allow_html=True)

# --- Custom Leaderboard & Highlights ---
col_lead, col_stats = st.columns([1.5, 1])

with col_lead:
    st.markdown("### 🏆 CLASIFICACIÓN GENERAL")
    
    df_acum = df.groupby("jugador").agg(
        pts=("puntos", "sum"),
        multas=("multa", "sum"),
        jornadas=("num_jornada", "nunique")
    ).reset_index().sort_values(by="pts", ascending=False).reset_index(drop=True)

    # HTML Leaderboard Construction - Clean non-indented multi-line
    rows_html = ""
    for i, row in df_acum.iterrows():
        rank_class = f"rank-{i+1}" if i < 3 else ""
        rows_html += f'<tr class="player-row {rank_class}">'
        rows_html += f'<td class="player-cell"><div class="rank-badge">{i+1}</div></td>'
        rows_html += f'<td class="player-cell player-name">{row["jugador"]}</td>'
        rows_html += f'<td class="player-cell pts-high">{int(row["pts"])}</td>'
        rows_html += f'<td class="player-cell">{row["multas"]:.2f} €</td>'
        rows_html += f'<td class="player-cell">{int(row["jornadas"])}</td>'
        rows_html += '</tr>'
    
    leaderboard_html = f"""<div class="leaderboard-container"><table class="leaderboard-table"><thead><tr><th class="leaderboard-header">POS</th><th class="leaderboard-header">JUGADOR</th><th class="leaderboard-header">PTS</th><th class="leaderboard-header">MULTAS</th><th class="leaderboard-header">JND</th></tr></thead><tbody>{rows_html}</tbody></table></div>"""
    st.write(leaderboard_html, unsafe_allow_html=True)

with col_stats:
    st.markdown("### 📈 RENDIMIENTO")
    df_grouped = df.groupby(["num_jornada", "jugador"])["puntos"].sum().reset_index()
    mejor_j = df_grouped.loc[df_grouped["puntos"].idxmax()]
    peor_j = df_grouped.loc[df_grouped["puntos"].idxmin()]
    media_j = df_grouped.groupby("num_jornada")["puntos"].mean().reset_index()

    st.markdown('<div class="glass-container">', unsafe_allow_html=True)
    m1, m2 = st.columns(2)
    m1.metric("🌟 MVP JORNADA", f"{mejor_j['puntos']} PTS", f"J{int(mejor_j['num_jornada'])} {mejor_j['jugador']}")
    m2.metric("💀 PEOR JORNADA", f"{peor_j['puntos']} PTS", f"J{int(peor_j['num_jornada'])} {peor_j['jugador']}", delta_color="inverse")
    
    st.markdown("---")
    m3, m4 = st.columns(2)
    m3.metric("📊 MEDIA LIGA", f"{media_j['puntos'].mean():.2f} PTS", "GLOBAL")
    m4.metric("🛡️ MEDIA SEGURIDAD", f"{media_no_pagar:.2f} PTS", "UMBRAL 3º")
    st.markdown('</div>', unsafe_allow_html=True)

st.markdown("<br><br>", unsafe_allow_html=True)

# --- Tabbed Analytics ---
st.markdown("### 📊 ANALÍTICAS AVANZADAS")
tab1, tab2, tab3, tab4 = st.tabs(["📉 EVOLUCION", "🗂️ POSICIONES", "💸 SANCIONES", "🎯 CONSISTENCIA"])

with tab1:
    c1, c2 = st.columns(2)
    with c1:
        fig_pts = px.line(df, x="num_jornada", y="puntos", color="jugador", markers=True, 
                         title="HISTÓRICO DE PUNTOS", color_discrete_map=color_map, template="plotly_white")
        fig_pts.update_layout(font_family="Outfit", paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
        st.plotly_chart(fig_pts, use_container_width=True)
    with c2:
        df["pts_acum"] = df.groupby("jugador")["puntos"].cumsum()
        fig_acum = px.line(df, x="num_jornada", y="pts_acum", markers=True, 
                          title="ACUMULADO TOTAL", color="jugador", color_discrete_map=color_map, template="plotly_white")
        fig_acum.update_layout(font_family="Outfit", paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
        st.plotly_chart(fig_acum, use_container_width=True)

with tab2:
    df_sorted = df.sort_values(["num_jornada"])
    df_sorted["puntos_acum"] = df_sorted.groupby("jugador")["puntos"].cumsum()
    df_cl = df_sorted.groupby("num_jornada", group_keys=True).apply(
        lambda d: d.assign(pos_gen=d["puntos_acum"].rank(method="dense", ascending=False).astype(int))
    ).reset_index(drop=True)
    
    fig_pos = px.line(df_cl, x="num_jornada", y="pos_gen", color="jugador", markers=True, 
                     title="POSICION EN TABLA GENERAL", color_discrete_map=color_map, template="plotly_white")
    fig_pos.update_layout(yaxis_autorange="reversed", font_family="Outfit", paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
    st.plotly_chart(fig_pos, use_container_width=True)

with tab3:
    df["multa_acum"] = df.groupby("jugador")["multa"].cumsum()
    fig_multa_evol = px.line(df, x="num_jornada", y="multa_acum", color="jugador", markers=True,
                             title="EVOLUCIÓN ACUMULADA DE MULTAS (€)", color_discrete_map=color_map, template="plotly_white")
    fig_multa_evol.update_layout(font_family="Outfit", paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
    st.plotly_chart(fig_multa_evol, use_container_width=True)

with tab4:
    fig_box = px.box(df, x="jugador", y="puntos", points="all", color="jugador", 
                    title="DISTRIBUCIÓN Y CONSISTENCIA", color_discrete_map=color_map, template="plotly_white")
    fig_box.update_layout(font_family="Outfit", paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
    st.plotly_chart(fig_box, use_container_width=True)

# --- Footer ---
st.markdown("""
<div class="custom-footer">
    ⚽ LALIGA GENUINE MOEVE | FANTASY DASHBOARD v2.0 PREMIUM<br>
    © 2025 Estadísticas Avanzadas para la Liga de Amigos
</div>
""", unsafe_allow_html=True)

