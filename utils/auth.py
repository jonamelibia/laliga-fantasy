# utils/auth.py
import streamlit as st

# --- Configuración de usuario y contraseña ---
def get_credentials():
    return st.secrets["app"]["user"], st.secrets["app"]["password"]

if "logged_in" not in st.session_state:
    st.session_state.logged_in = False
if "user" not in st.session_state:
    st.session_state.user = None
if "show_continue" not in st.session_state:
    st.session_state.show_continue = False

# --- Login obligatorio ---
def login_required():
    if "logged_in" not in st.session_state:
        st.session_state.logged_in = False
    if "user" not in st.session_state:
        st.session_state.user = None
    if "show_continue" not in st.session_state:
        st.session_state.show_continue = False
    if not st.session_state.logged_in:
        st.title("🔑 Iniciar sesión")
        username = st.text_input("Usuario", key="login_user")
        password = st.text_input("Contraseña", type="password", key="login_pass")

        if st.button("Entrar"):
            USER, PASS = get_credentials()
            if username == USER and password == PASS:
                st.session_state.logged_in = True
                st.session_state.user = username
                st.success(f"✅ Bienvenido, {username}. Pulse nuevamente para continuar.")
            else:
                st.error("❌ Usuario o contraseña incorrectos")

        st.stop()  # detener ejecución hasta login

# --- Botón de logout ---
def logout_button():
    init_session_state()
    if st.sidebar.button("Cerrar sesión"):
        st.session_state.logged_in = False
        st.session_state.user = None
        st.success("🔒 Has cerrado sesión correctamente")
        st.stop()
