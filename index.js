const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PANEL_URL = "https://oline.jkt48-private.com";

// GANTI DENGAN API KEY PANEL KAMU
const API_KEY = "ptla_8JaYUZwpwd8spdiPZj4tXLUZYRf7zan7Ex3A0bD1kZn";

// TEST BACKEND
app.get("/", (req, res) => {
  res.send("Backend aktif");
});

// CREATE PANEL
app.post("/create-panel", async (req, res) => {

  try {

    const { username, ram } = req.body;

    // VALIDASI
    if (!username || !ram) {
      return res.status(400).json({
        success: false,
        error: "Username dan RAM wajib diisi"
      });
    }

    // PASSWORD AUTO
    const password = username + "123";

    // CREATE USER
    const userRes = await axios.post(
      `${PANEL_URL}/api/application/users`,
      {
        email: `${username}@gmail.com`,
        username: username,
        first_name: username,
        last_name: "Store",
        password: password
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          Accept: "Application/vnd.pterodactyl.v1+json",
          "Content-Type": "application/json"
        }
      }
    );

    const userId = userRes.data.attributes.id;

    // CREATE SERVER
    const serverRes = await axios.post(
      `${PANEL_URL}/api/application/servers`,
      {
        name: username,

        user: userId,

        nest: 5,

        egg: 15,

        docker_image: "ghcr.io/pterodactyl/yolks:nodejs_18",

        startup:
          'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; if [[ ! -z ${CUSTOM_ENVIRONMENT_VARIABLES} ]]; then vars=$(echo ${CUSTOM_ENVIRONMENT_VARIABLES} | tr ";" "\\n"); for line in $vars; do export $line; done fi; /usr/local/bin/${CMD_RUN};',

        environment: {
          INST: "npm",
          USER_UPLOAD: "0",
          AUTO_UPDATE: "0",
          CMD_RUN: "npm start"
        },

        limits: {
          memory: Number(ram),
          swap: 0,
          disk: 1024,
          io: 500,
          cpu: 100
        },

        feature_limits: {
          databases: 1,
          allocations: 1,
          backups: 1
        },

        deploy: {
          locations: [1],
          dedicated_ip: false
        }

      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          Accept: "Application/vnd.pterodactyl.v1+json",
          "Content-Type": "application/json"
        }
      }
    );

    return res.json({
      success: true,
      username: username,
      password: password,
      ram: ram,
      domain: PANEL_URL,
      server_id: serverRes.data.attributes.id
    });

  } catch (err) {

    console.log(JSON.stringify(err.response?.data, null, 2));

    return res.status(500).json({
      success: false,
      error: err.response?.data || err.message
    });

  }

});

app.listen(3000, () => {
  console.log("Server running...");
});
