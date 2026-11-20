import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { createApp } from "../src/app.js";
import { User } from "../src/models/User.js";
import { Track } from "../src/models/Track.js";

let server, base;

test.before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

test("health sans dépendre de MongoDB", async () => {
  const r = await fetch(base + "/api/health");
  assert.equal(r.status, 200);
  assert.equal((await r.json()).status, "ok");
});

test("schémas Mongoose, pseudo, confidentialité et relation", async () => {
  const u = new User({
    name: "Test",
    username: "TeSt_User",
    email: "TEST@example.com",
    password: "12345678",
  });

  await u.validate();
  assert.equal(u.email, "test@example.com");
  assert.equal(u.username, "test_user");
  assert.equal(u.visibility, "public");
  assert.equal(u.avatarId, "animal-cat");
  assert.equal(u.toPublic().username, "test_user");
  assert.equal(u.toPublic().avatarId, "animal-cat");

  const invalidUsername = new User({
    name: "Invalid",
    username: "not-valid!",
    email: "invalid@example.com",
    password: "12345678",
  });
  await assert.rejects(invalidUsername.validate());
  const t = new Track({
    ownerId: new mongoose.Types.ObjectId(),
    title: "Blues",
    originalName: "b.mp3",
    storedName: "x.mp3",
    mimeType: "audio/mpeg",
    size: 42,
  });
  
  assert.equal(t.title, "Blues");
  assert.equal(Track.schema.path("ownerId").options.ref, "User");
});

test("le schéma limite les icônes de profil au catalogue", async () => {
  const u = new User({ name: "Test", username: "avatar_user", email: "avatar@example.com", password: "12345678", avatarId: "not-an-icon" });
  await assert.rejects(u.validate());
});
