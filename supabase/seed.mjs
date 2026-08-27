/**
 * Revibase — données de démonstration.
 *
 * Crée des comptes via l'API d'administration Supabase (comptes valides,
 * contrairement à des INSERT SQL bruts dans auth.users), puis insère une
 * classe d'exemple avec chapitres, questions, réponses, votes et commentaires.
 *
 * Prérequis : `.env.local` renseigné (dont SUPABASE_SERVICE_ROLE_KEY).
 * Lancer :
 *
 *   node --env-file=.env.local supabase/seed.mjs
 *
 * Idempotent : relancer réutilise les comptes existants et ne recrée pas la
 * classe si son code d'invitation existe déjà.
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Variables manquantes. Lance avec :  node --env-file=.env.local supabase/seed.mjs");
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "password123";
const JOIN_CODE = "DEMO2026";

const PEOPLE = [
  { key: "trainer", email: "sofia@revibase.test", name: "Sofia (formatrice)", role: "trainer" },
  { key: "thomas", email: "thomas@revibase.test", name: "Thomas", role: "student" },
  { key: "julie", email: "julie@revibase.test", name: "Julie", role: "student" },
  { key: "marc", email: "marc@revibase.test", name: "Marc", role: "student" },
];

async function findUserByEmail(email) {
  // Pagination simple (le projet de démo a peu de comptes).
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      console.error("\nL'API d'administration Supabase renvoie une erreur :", error.message);
      console.error("Des lignes auth.users invalides (ancien seed SQL) la bloquent sans doute.");
      console.error("Exécute d'abord dans le SQL Editor :");
      console.error("  delete from auth.users where email like '%@revibase.test';\n");
      process.exit(1);
    }
    const hit = data.users.find((u) => u.email === email);
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function ensureUser({ email, name }) {
  const existing = await findUserByEmail(email);
  if (existing) return existing.id;

  const { data, error } = await db.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: name },
  });
  if (error) throw error;
  return data.user.id;
}

async function main() {
  console.log("Comptes de démonstration…");
  const ids = {};
  for (const p of PEOPLE) {
    ids[p.key] = await ensureUser(p);
    console.log(`  ${p.email}  (${PASSWORD})`);
  }

  const { data: already } = await db
    .from("classes")
    .select("id")
    .eq("join_code", JOIN_CODE)
    .maybeSingle();

  if (already) {
    console.log(`\nClasse "${JOIN_CODE}" déjà présente — rien à recréer.`);
    return;
  }

  console.log("\nClasse, chapitres et contenu…");

  const { data: cls, error: clsErr } = await db
    .from("classes")
    .insert({ name: "Promo Conduite — 2026", join_code: JOIN_CODE, created_by: ids.trainer })
    .select("id")
    .single();
  if (clsErr) throw clsErr;
  const classId = cls.id;

  const { error: memErr } = await db
    .from("class_members")
    .insert(PEOPLE.map((p) => ({ class_id: classId, user_id: ids[p.key], role: p.role })));
  if (memErr) throw memErr;

  const chapterNames = ["Signalisation", "Réglementation", "Matériel", "Sécurité"];
  const { data: chapters, error: chErr } = await db
    .from("chapters")
    .insert(chapterNames.map((name, position) => ({ class_id: classId, name, position })))
    .select("id, name");
  if (chErr) throw chErr;
  const chapterId = Object.fromEntries(chapters.map((c) => [c.name, c.id]));

  // NB : toutes les lignes d'un insert multiple doivent avoir EXACTEMENT les
  // mêmes clés — sinon PostgREST envoie NULL pour les clés absentes.
  const { data: questions, error: qErr } = await db
    .from("questions")
    .insert([
      {
        class_id: classId,
        chapter_id: chapterId["Signalisation"],
        author_id: ids.thomas,
        title: "Que signifie un carré violet ?",
        body: "Je le confonds avec le carré. Quelle conduite à tenir ?",
      },
      {
        class_id: classId,
        chapter_id: chapterId["Signalisation"],
        author_id: ids.julie,
        title: "Différence entre un sémaphore et un carré ?",
        body: null,
      },
      {
        class_id: classId,
        chapter_id: chapterId["Réglementation"],
        author_id: ids.marc,
        title: "Quand demande-t-on une autorisation de franchissement ?",
        body: "Je n'arrive pas à retenir la liste.",
      },
      {
        class_id: classId,
        chapter_id: chapterId["Sécurité"],
        author_id: ids.julie,
        title: "Ordre des actions en cas de heurt d'obstacle ?",
        body: "Protéger, alerter, … ?",
      },
    ])
    .select("id, title");
  if (qErr) throw qErr;

  const q = Object.fromEntries(questions.map((row) => [row.title, row.id]));

  const { data: answers, error: ansErr } = await db
    .from("answers")
    .insert([
      {
        question_id: q["Que signifie un carré violet ?"],
        author_id: ids.julie,
        body: "Le carré violet commande l'arrêt aux mouvements de manœuvre ; un train en marche normale n'est pas concerné sauf indication contraire.",
        accepted: true,
      },
      {
        question_id: q["Que signifie un carré violet ?"],
        author_id: ids.marc,
        body: "Moyen mnémo : violet = manœuvre.",
        accepted: false,
      },
      {
        question_id: q["Ordre des actions en cas de heurt d'obstacle ?"],
        author_id: ids.marc,
        body: "Protéger (couvrir la voie et les voies contiguës si besoin), alerter l'agent-circulation, rendre compte, puis reconnaître si les conditions le permettent.",
        accepted: false,
      },
    ])
    .select("id, question_id, body");
  if (ansErr) throw ansErr;

  const validated = answers.find((a) => a.body.startsWith("Le carré violet"));
  await db
    .from("answers")
    .update({ validated_by: ids.trainer, validated_at: new Date().toISOString() })
    .eq("id", validated.id);

  await db.from("answer_votes").insert([
    { answer_id: validated.id, user_id: ids.thomas },
    { answer_id: validated.id, user_id: ids.marc },
    { answer_id: validated.id, user_id: ids.trainer },
  ]);

  await db.from("comments").insert([
    {
      question_id: q["Que signifie un carré violet ?"],
      author_id: ids.thomas,
      body: "Merci, c'est plus clair.",
    },
    {
      question_id: q["Que signifie un carré violet ?"],
      author_id: ids.trainer,
      body: "On revoit ça au prochain TP.",
    },
  ]);

  console.log(`\nOK. Classe "Promo Conduite — 2026", code ${JOIN_CODE}.`);
  console.log(`Connecte-toi avec sofia@revibase.test / ${PASSWORD} (formatrice).`);
}

main().catch((err) => {
  console.error("\nÉchec du seed :", err.message ?? err);
  process.exit(1);
});
