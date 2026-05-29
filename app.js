(() => {
  const SUPABASE_URL = "https://siikexaywqxebiggjhez.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpaWtleGF5d3F4ZWJpZ2dqaGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODQwNDMsImV4cCI6MjA5NTY2MDA0M30.NaqKoAPHC4fo3LIoTEFXAZq3NNjVUeLf1Ugqo6JFvLI";

  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  window.register = async function () {
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    const { error } = await db.auth.signUp({
      email,
      password
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Konto utworzone. Sprawdź maila.");
    }
  };

  window.login = async function () {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const { data, error } = await db.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Zalogowano: " + data.user.email);
  };
})();
