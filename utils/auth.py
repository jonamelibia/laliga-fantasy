import streamlit as st

# --- Configuración de usuario y contraseña ---
USER = st.secrets["app"]["user"]
PASS = st.secrets["app"]["password"]

# --- Inicializar session_state de forma segura ---
def init_session_state():
    defaults = {
        "logged_in": False,
        "user": None,
        "show_continue": False,
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value

# --- Login obligatorio ---
def login_required():
    init_session_state()  # siempre inicializamos antes de usar

    if not st.session_state.logged_in:
        st.title("🔑 Iniciar sesión")
        username = st.text_input("Usuario", key="login_user")
        password = st.text_input("Contraseña", type="password", key="login_pass")

        if st.button("Entrar"):
            if username == USER and password == PASS:
                st.session_state.logged_in = True
                st.session_state.user = username
                st.success(f"✅ Bienvenido, {username}. Pulse nuevamente para continuar.")
            else:
                st.error("❌ Usuario o contraseña incorrectos")

        st.stop()  # detener ejecución hasta que haga login

# --- Botón de logout ---
def logout_button():
    init_session_state()  # inicializamos también aquí
    if st.sidebar.button("Cerrar sesión"):
        st.session_state.logged_in = False
        st.session_state.user = None
        st.success("🔒 Has cerrado sesión correctamente")
        st.stop()
