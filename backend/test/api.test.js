import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { createApp } from "../src/app.js";
import { User } from "../src/models/User.js";
import { Track } from "../src/models/Track.js";
import { Recommendation } from "../src/models/Recommendation.js";
import { Friendship } from "../src/models/Friendship.js";
import { formatMemberId, parseMemberIdSearch } from "../src/utils/member-id.js";

let server, base;

test.before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

test("health sans dépendre de MongoDB", async () => {
  const response = await fetch(base + "/api/health");
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, "ok");
});

test("schémas utilisateur et piste", async () => {
  const user = new User({ memberNumber: 1, name: "Test", username: "TeSt_User", email: "TEST@example.com", password: "12345678" });
  await user.validate();
  assert.equal(user.email, "test@example.com");
  assert.equal(user.username, "test_user");
  assert.equal(user.visibility, "public");
  assert.equal(user.avatarId, "animal-cat");
  assert.equal(user.toPublic().username, "test_user");
  assert.equal(user.toPublic().memberId, "#0001");
  assert.equal(formatMemberId(32), "#0032");
  assert.equal(parseMemberIdSearch("#0001"), 1);
  assert.equal(parseMemberIdSearch("0001"), 1);
  assert.equal(parseMemberIdSearch("anais"), null);

  const invalidUsername = new User({ memberNumber: 2, name: "Invalid", username: "not-valid!", email: "invalid@example.com", password: "12345678" });
  await assert.rejects(invalidUsername.validate());

  const track = new Track({
    ownerId: new mongoose.Types.ObjectId(), title: "Blues", originalName: "b.mp3",
    storedName: "x.mp3", mimeType: "audio/mpeg", size: 42,
  });
  assert.equal(track.title, "Blues");
  assert.equal(Track.schema.path("ownerId").options.ref, "User");
});

test("le schéma utilisateur limite les icônes au catalogue", async () => {
  const user = new User({ memberNumber: 3, name: "Test", username: "avatar_user", email: "avatar@example.com", password: "12345678", avatarId: "not-an-icon" });
  await assert.rejects(user.validate());
});

test("le modèle d’amitié distingue une demande en attente d’une relation acceptée", async () => {
  const friendship = new Friendship({ requesterId: new mongoose.Types.ObjectId(), recipientId: new mongoose.Types.ObjectId() });
  await friendship.validate();
  assert.equal(friendship.status, "pending");
  friendship.status = "accepted";
  await friendship.validate();
  assert.equal(Friendship.schema.path("requesterId").options.ref, "User");
});

test("le modèle de recommandation valide la note et protège les métadonnées d’image", async () => {
  const recommendation = new Recommendation({
    ownerId: new mongoose.Types.ObjectId(),
    animeTitle: "  Naruto  ",
    rating: 8.5,
    comment: "Une recommandation",
    seasonOrVolume: "Saison 1",
  });
  await recommendation.validate();
  assert.equal(recommendation.animeTitle, "Naruto");
  assert.equal(recommendation.toPublic().rating, 8.5);
  assert.equal(recommendation.toPublic().imageUrl, null);
  assert.equal("imageFilename" in recommendation.toPublic(), false);

  const invalid = new Recommendation({ ownerId: new mongoose.Types.ObjectId(), animeTitle: "Naruto", rating: 11 });
  await assert.rejects(invalid.validate());
});

test("les modifications de recommandations exigent une authentification", async () => {
  const responses = await Promise.all([
    fetch(base + "/api/recommendations", { method: "POST" }),
    fetch(base + "/api/recommendations/not-an-id", { method: "PUT" }),
    fetch(base + "/api/recommendations/not-an-id", { method: "DELETE" }),
  ]);
  assert.deepEqual(responses.map((response) => response.status), [401, 401, 401]);

  const publicImageMiss = await fetch(base + "/api/recommendations/not-an-id/image");
  assert.equal(publicImageMiss.status, 404);
});

test("les routes de recherche et gestion des amis exigent une authentification", async () => {
  const responses = await Promise.all([
    fetch(base + "/api/users/search?q=ana"),
    fetch(base + "/api/friends"),
    fetch(base + "/api/friends/requests"),
    fetch(base + "/api/friends/status/507f1f77bcf86cd799439011"),
    fetch(base + "/api/friends/requests/507f1f77bcf86cd799439011", { method: "DELETE" }),
  ]);
  assert.deepEqual(responses.map((response) => response.status), [401, 401, 401, 401, 401]);
});

test("un identifiant invalide ne peut pas servir à lire un profil", async () => {
  const response = await fetch(base + "/api/users/not-an-id");
  assert.equal(response.status, 404);
});

test("la recherche publique du fil limite le titre et le pseudo", async () => {
  const [titleResponse, authorResponse] = await Promise.all([
    fetch(base + "/api/recommendations?q=" + "a".repeat(101)),
    fetch(base + "/api/recommendations?author=" + "a".repeat(25)),
  ]);
  assert.equal(titleResponse.status, 400);
  assert.equal(authorResponse.status, 400);
});
