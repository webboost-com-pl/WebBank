(() => {
  const SUPABASE_URL = "https://siikexaywqxebiggjhez.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpaWtleGF5d3F4ZWJpZ2dqaGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODQwNDMsImV4cCI6MjA5NTY2MDA0M30.NaqKoAPHC4fo3LIoTEFXAZq3NNjVUeLf1Ugqo6JFvLI";

  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  window.register = async function () {
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    const { error } = await db.auth.signUp({ email, password });

    if (error) {
      alert(error.message);
    } else {
      alert("Konto utworzone. Możesz się zalogować.");
    }
  };

  window.login = async function () {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const { data, error } = await db.auth.signInWithPassword({ email, password });

    if (error) {
      alert(error.message);
      return;
    }

    await createBankAccountIfNeeded(data.user);
    await showPanel(data.user);
  };

  async function createBankAccountIfNeeded(user) {
    const { data: existingAccount } = await db
      .from("bank_accounts")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingAccount) {
      const { error } = await db
        .from("bank_accounts")
        .insert({
          user_id: user.id,
          balance: 0
        });

      if (error) {
        alert("Błąd tworzenia konta bankowego: " + error.message);
      }
    }
  }

  async function showPanel(user) {
    document.getElementById("panel").style.display = "block";
    document.getElementById("userEmail").textContent = "Zalogowano jako: " + user.email;

    await loadBalance();
    await loadHistory();
  }

  async function loadBalance() {
    const { data, error } = await db
      .from("bank_accounts")
      .select("balance")
      .maybeSingle();

    if (error) {
      alert("Błąd pobierania salda: " + error.message);
      return;
    }

    if (data) {
      document.getElementById("balance").textContent = data.balance;
    }
  }

  window.deposit = async function () {
    const amount = Number(document.getElementById("depositAmount").value);

    if (!amount || amount <= 0) {
      alert("Podaj poprawną kwotę.");
      return;
    }

    const { data: account, error: accountError } = await db
      .from("bank_accounts")
      .select("*")
      .maybeSingle();

    if (accountError || !account) {
      alert("Nie znaleziono konta bankowego.");
      return;
    }

    const newBalance = Number(account.balance) + amount;

    const { error: updateError } = await db
      .from("bank_accounts")
      .update({ balance: newBalance })
      .eq("id", account.id);

    if (updateError) {
      alert("Błąd aktualizacji salda: " + updateError.message);
      return;
    }

    const { data: userData } = await db.auth.getUser();

    await db
      .from("transactions")
      .insert({
        user_id: userData.user.id,
        type: "Wpłata",
        amount: amount,
        description: "Wpłata testowa"
      });

    document.getElementById("depositAmount").value = "";

    await loadBalance();
    await loadHistory();
  };

  async function loadHistory() {
    const { data, error } = await db
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Błąd historii: " + error.message);
      return;
    }

    const history = document.getElementById("history");
    history.innerHTML = "";

    data.forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.type} | ${item.amount} zł | ${item.description}`;
      history.appendChild(li);
    });
  }

  window.logout = async function () {
    await db.auth.signOut();
    location.reload();
  };

  async function checkSession() {
    const { data } = await db.auth.getUser();

    if (data.user) {
      await createBankAccountIfNeeded(data.user);
      await showPanel(data.user);
    }
  }

  checkSession();
})();
