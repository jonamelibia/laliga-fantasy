import streamlit as st

# Configuración de usuario y contraseña
USER = st.secrets["app"]["user"]
PASS = st.secrets["app"]["password"]

# Inicialización segura de session_state
def init_session_state():
    defaults = {
        "logged_in": False,
        "show_continue": False,
        "user": None,
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value

init_session_state()  # Esto se llama siempre al inicio

def login_required():
    if not st.session_state.logged_in:
        st.title("🔑 Iniciar sesión")
        username = st.text_input("Usuario", key="login_user")
        password = st.text_input("Contraseña", type="password", key="login_pass")

        if st.button("Entrar"):
            if username == USER and password == PASS:
                st.session_state.logged_in = True
                st.session_state.user = username
                st.success(f"✅ Bienvenido, {username}, vuelva a pulsar el botón para continuar.")
            else:
                st.error("❌ Usuario o contraseña incorrectos")

        st.stop()

def logout_button():
    if st.sidebar.button("Cerrar sesión"):
        st.session_state.logged_in = False
        st.session_state.user = None
        st.success("🔒 Has cerrado sesión correctamente")
        st.stop()
