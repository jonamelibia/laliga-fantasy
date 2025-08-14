import streamlit as st

USER = st.secrets["app"]["user"]
PASS = st.secrets["app"]["password"]

if "logged_in" not in st.session_state:
    st.session_state.logged_in = False

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

        st.stop()  # Evita que se ejecute el resto del script hasta hacer login

def logout_button():
    if st.sidebar.button("Cerrar sesión"):
        st.session_state.logged_in = False
        st.session_state.user = None
        st.success("🔒 Has cerrado sesión correctamente")
        st.stop()
