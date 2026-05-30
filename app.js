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
      return;
    }

    alert("Konto utworzone. Teraz się zaloguj.");
    window.location.href = "login.html";
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
    window.location.href = "dashboard.html";
  };
function generateAccountNumber() {
  return "WB" + Math.floor(
    1000000000 + Math.random() * 9000000000
  );
}
async function createBankAccountIfNeeded(user) {
  const { data, error } = await db
    .from("bank_accounts")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    alert("Błąd sprawdzania konta: " + error.message);
    return;
  }

  if (!data) {
    const { error: insertError } = await db.from("bank_accounts").insert({
      user_id: user.id,
      balance: 0,
      account_number: generateAccountNumber()
    });

    if (insertError) {
      alert("Błąd tworzenia konta bankowego: " + insertError.message);
    }
  }
}

  async function loadDashboard() {
    if (!document.getElementById("balance")) return;

    const { data: userData } = await db.auth.getUser();

    if (!userData.user) {
      window.location.href = "login.html";
      return;
    }

    document.getElementById("userEmail").textContent =
      "Zalogowano jako: " + userData.user.email;

    await createBankAccountIfNeeded(userData.user);
    await loadBalance();
    await loadHistory();
  }

  async function loadBalance() {
    const { data, error } = await db
      .from("bank_accounts")
      .select("balance")
      .maybeSingle();

    if (error) {
      alert(error.message);
      return;
    }

    document.getElementById("balance").textContent = data ? data.balance : 0;
  }

  window.deposit = async function () {
    const amount = Number(document.getElementById("depositAmount").value);

    if (!amount || amount <= 0) {
      alert("Podaj poprawną kwotę.");
      return;
    }

    const { data: account } = await db
      .from("bank_accounts")
      .select("*")
      .maybeSingle();

    const newBalance = Number(account.balance) + amount;

    await db
      .from("bank_accounts")
      .update({ balance: newBalance })
      .eq("id", account.id);

    const { data: userData } = await db.auth.getUser();

    await db.from("transactions").insert({
      user_id: userData.user.id,
      type: "Wpłata",
      amount,
      description: "Wpłata testowa"
    });

    document.getElementById("depositAmount").value = "";
    await loadBalance();
    await loadHistory();
  };

  async function loadHistory() {
    const { data } = await db
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

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
    window.location.href = "index.html";
  };

  loadDashboard();
})();
