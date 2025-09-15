const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(cors());
app.use(express.json());

// Middleware: simple check for admin auth
const adminAuthMiddleware = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (apiKey === "My_Admin_key_is_best") {
    next();
  } else {
    res.status(403).json({ error: "Unauthorized" });
  }
};

// CREATE USER
app.post("/createUser", adminAuthMiddleware, async (req, res) => {
  const {
    email,
    password,
    name,
    surname,
    department,
    role,
    position,
    company,
    languages,
    telephone,
    employmentType,
    location,
  } = req.body;

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
    });

    // Save user data in Firestore
    const userData = {
      email,
      name,
      surname,
      department,
      role,
      position,
      company,
      languages,
      telephone,
      employmentType,
      location,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isOnline: false,
      presenceState: "offline",
    };

    await admin
      .firestore()
      .collection("users")
      .doc(userRecord.uid)
      .set(userData);

    res.status(201).json({
      success: true,
      user: {
        uid: userRecord.uid,
        email,
        name,
        surname,
        department,
        role,
        position,
        company,
        languages,
        telephone,
        employmentType,
        location,
        createdAt: new Date().toISOString(),
        isOnline: false,
        presenceState: "offline",
      },
      message: "User created",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE USER
app.delete("/deleteUser/:uid", adminAuthMiddleware, async (req, res) => {
  const uid = req.params.uid;

  try {
    await admin.auth().deleteUser(uid);
    await admin.firestore().collection("users").doc(uid).delete();
    res.json({ success: true, message: `Deleted user ${uid}`, id: uid });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
