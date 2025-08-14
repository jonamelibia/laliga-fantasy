import streamlit as st

USER = st.secrets["app"]["user"]
PASS = st.secrets["app"]["password"]

# Inicializar session_state de forma segura
for key in ("logged_in", "show_continue", "user"):
    if key not in st.session_state:
        st.session_state[key] = False if key != "user" else None

def login_required():
    if not st.session_state.logged_in:
        st.title("🔑 Iniciar sesión")
        username = st.text_input("Usuario", key="login_user")
        password = st.text_input("Contraseña", type="password", key="login_pass")

        if st.button("Entrar"):
            if username == USER and password == PASS:
                st.session_state.logged_in = True
                st.session_state.user = username
                st.session_state.show_continue = True
            else:
                st.error("❌ Usuario o contraseña incorrectos")
                st.session_state.show_continue = False
        st.stop()  # Bloquear ejecución hasta login exitoso

    # Una vez logueado, mostrar botón "Continuar" si no se ha pulsado aún
    if st.session_state.show_continue:
        if st.button("Continuar"):
            st.session_state.show_continue = False  # Oculta el botón al continuar
        else:
            st.stop()  # Bloquea hasta que se pulse "Continuar"
