const SUPABASE_URL = "https://siikexaywqxebiggjhez.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpaWtleGF5d3F4ZWJpZ2dqaGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODQwNDMsImV4cCI6MjA5NTY2MDA0M30.NaqKoAPHC4fo3LIoTEFXAZq3NNjVUeLf1Ugqo6JFvLI";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function register() {
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  const { error } = await supabase.auth.signUp({
    email: email,
    password: password
  });

  if (error) {
    alert(error.message);
  } else {
    alert("Konto utworzone. Sprawdź maila i potwierdź rejestrację.");
  }
}

async function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    alert(error.message);
    return;
  }

  await createBankAccountIfNeeded(data.user);
  showPanel(data.user);
}

async function createBankAccountIfNeeded(user) {
  const { data: existingAccount } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!existingAccount) {
    await supabase
      .from("bank_accounts")
      .insert({
        user_id: user.id,
        balance: 0
      });
  }
}

async function showPanel(user) {
  document.getElementById("panel").style.display = "block";
  document.getElementById("userEmail").textContent = "Zalogowano jako: " + user.email;

  await loadBalance();
  await loadHistory();
}

async function loadBalance() {
  const { data, error } = await supabase
    .from("bank_accounts")
    .select("balance")
    .single();

  if (error) {
    console.log(error);
    return;
  }

  document.getElementById("balance").textContent = data.balance;
}

async function deposit() {
  const amount = Number(document.getElementById("depositAmount").value);

  if (!amount || amount <= 0) {
    alert("Podaj poprawną kwotę.");
    return;
  }

  const { data: account } = await supabase
    .from("bank_accounts")
    .select("*")
    .single();

  const newBalance = Number(account.balance) + amount;

  await supabase
    .from("bank_accounts")
    .update({ balance: newBalance })
    .eq("id", account.id);

  const { data: userData } = await supabase.auth.getUser();

  await supabase
    .from("transactions")
    .insert({
      user_id: userData.user.id,
      type: "deposit",
      amount: amount,
      description: "Wpłata testowa"
    });

  document.getElementById("depositAmount").value = "";

  await loadBalance();
  await loadHistory();
}

async function loadHistory() {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.log(error);
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

async function logout() {
  await supabase.auth.signOut();
  location.reload();
}

async function checkSession() {
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    await createBankAccountIfNeeded(data.user);
    showPanel(data.user);
  }
}

checkSession();

window.register = register;
window.login = login;
window.deposit = deposit;
window.logout = logout;
