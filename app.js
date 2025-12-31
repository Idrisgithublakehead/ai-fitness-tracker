/* 
  AI Fitness Tracker (Frontend MVP)
  - Stores workout logs in localStorage
  - Renders history in the UI
  - Generates a recommendation using a simple heuristic engine
  - Designed so the recommendation function can later be replaced with OpenAI API calls
*/

"use strict";

/* DOM references */
const formEl = document.getElementById("workoutForm");
const logEl = document.getElementById("log");
const suggestionEl = document.getElementById("suggestion");

/* Storage configuration */
const STORAGE_KEY = "aft_workouts_v1";

/* App state */
let workouts = loadWorkouts();

/* Initialize UI */
renderWorkoutLog();
renderRecommendation();

/* Event: form submit */
formEl.addEventListener("submit", (e) => {
  e.preventDefault();

  const workout = buildWorkoutFromForm();
  if (!workout) return; // validation failed

  workouts.push(workout);
  saveWorkouts(workouts);

  resetFormDefaults();
  renderWorkoutLog();
  renderRecommendation();
});

/* Build a workout object from the form fields (with validation) */
function buildWorkoutFromForm() {
  const exercise = getValue("exercise");
  const sets = getNumber("sets");
  const reps = getNumber("reps");
  const weight = getNumber("weight");

  // Basic validation: keep data clean for analytics later
  if (!exercise) {
    setSuggestion("Please enter an exercise name.");
    return null;
  }
  if (!isPositiveInt(sets) || !isPositiveInt(reps) || weight < 0) {
    setSuggestion("Please enter valid numbers for sets, reps, and weight.");
    return null;
  }

  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    exercise,
    sets,
    reps,
    weight,
    volume: sets * reps * weight,
    createdAt: new Date().toISOString(),
  };
}

/* Render workout list in the UI */
function renderWorkoutLog() {
  logEl.innerHTML = "";

  if (workouts.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No workouts yet — log your first set.";
    logEl.appendChild(li);
    return;
  }

  // Show newest first
  const latestFirst = [...workouts].reverse();
  latestFirst.forEach((w) => {
    const li = document.createElement("li");
    li.textContent = `${w.exercise} — ${w.sets}x${w.reps} @ ${w.weight} lb (Vol: ${w.volume})`;
    logEl.appendChild(li);
  });
}

/* Render recommendation panel */
function renderRecommendation() {
  if (workouts.length === 0) {
    setSuggestion("Add a workout to receive a training suggestion.");
    return;
  }

  const last = workouts[workouts.length - 1];
  const recommendation = generateRecommendation(last, workouts);

  setSuggestion(recommendation);
}

/* Recommendation engine (heuristic MVP)
   Later: replace this function with an OpenAI API call via a backend */
function generateRecommendation(lastWorkout, allWorkouts) {
  const { exercise, sets, reps, weight, volume } = lastWorkout;

  // Find previous workout for the same exercise (for progression)
  const previous = findPreviousSameExercise(exercise, allWorkouts);

  // Progressive overload guidance
  let tip = `For "${exercise}", consider adding +1 rep per set next time, or +5 lb if your form stays solid.`;

  // Rep-range logic
  if (reps >= 12) {
    tip = `You hit ${reps} reps on "${exercise}". Consider increasing weight (+5 lb) and aiming for 8–10 reps next session.`;
  } else if (reps <= 5) {
    tip = `Low-rep work is great for strength. For "${exercise}", keep reps 3–6 and focus on clean, controlled sets.`;
  }

  // Volume logic (simple load management)
  if (volume < 2000) {
    tip = `Your volume for "${exercise}" was ${volume}. To build more muscle, add 1 set or +2 reps next time (if recovery feels good).`;
  }

  // If we have a previous workout for the same exercise, compare progression
  if (previous) {
    if (lastWorkout.volume > previous.volume) {
      return `Nice progress on "${exercise}" — your volume increased from ${previous.volume} → ${lastWorkout.volume}. Keep the momentum: ${tip}`;
    }
    if (lastWorkout.volume < previous.volume) {
      return `Your "${exercise}" volume dropped from ${previous.volume} → ${lastWorkout.volume}. That’s okay — consider lighter day/recovery, then ramp back up next session.`;
    }
    return `You matched your last "${exercise}" volume (${volume}). To progress, try a small bump: +1 rep per set or +2.5–5 lb.`;
  }

  return `Based on your last "${exercise}" workout (Vol: ${volume}): ${tip}`;
}

/* Find the previous workout entry for the same exercise */
function findPreviousSameExercise(exercise, allWorkouts) {
  const same = allWorkouts.filter(
    (w) => w.exercise.toLowerCase() === exercise.toLowerCase()
  );
  if (same.length < 2) return null;
  return same[same.length - 2]; // second last is "previous"
}

/* LocalStorage helpers */
function loadWorkouts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWorkouts(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/* UI helpers */
function setSuggestion(text) {
  suggestionEl.textContent = text;
}

/* Form helpers */
function getValue(id) {
  return document.getElementById(id).value.trim();
}

function getNumber(id) {
  return Number(document.getElementById(id).value);
}

function isPositiveInt(n) {
  return Number.isInteger(n) && n > 0;
}

function resetFormDefaults() {
  formEl.reset();
  document.getElementById("sets").value = 3;
  document.getElementById("reps").value = 8;
  document.getElementById("weight").value = 135;
}
