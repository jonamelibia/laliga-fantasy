import streamlit as st
import os
from dotenv import load_dotenv

load_dotenv()

USER = os.getenv("APP_USER")
PASS = os.getenv("APP_PASS")

def login_required():
    """Función para verificar login en cada página."""
    if "logged_in" not in st.session_state:
        st.session_state.logged_in = False

    if not st.session_state.logged_in:
        st.title("🔑 Iniciar sesión")
        username = st.text_input("Usuario")
        password = st.text_input("Contraseña", type="password")
        
        if st.button("Entrar"):
            if username == USER and password == PASS:
                st.session_state.logged_in = True
                st.session_state.user = username
                st.rerun()
            else:
                st.error("❌ Usuario o contraseña incorrectos")
        st.stop()  # Evita que se renderice el resto de la página

def logout_button():
    """Botón para cerrar sesión"""
    if st.sidebar.button("Cerrar sesión"):
        st.session_state.logged_in = False
        st.session_state.user = None
        st.rerun()
