import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import logger from 'morgan';
import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
import {fileURLToPath} from 'url';

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from "firebase/firestore";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log(__filename)
console.log(__dirname)

const urlencodedParser = bodyParser.urlencoded({ extended: true });

// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration

const firebaseConfig = {

  apiKey: "AIzaSyBAnN60-yIbaJjKoQg1nDFebm2fGgGncgA",

  authDomain: "nlp-dynamic-impressions.firebaseapp.com",

  projectId: "nlp-dynamic-impressions",

  storageBucket: "nlp-dynamic-impressions.appspot.com",

  messagingSenderId: "914057375130",

  appId: "1:914057375130:web:6d8b8a8abd36f4c8fd1e23",

  measurementId: "G-YF915CTCP4"

};


// Initialize Firebase

const app = express();
const firebase_app = initializeApp(firebaseConfig);

const db = getFirestore(firebase_app);

app.post("/request_subj_id", urlencodedParser, (req, res) => {
  console.log(req.body)

  try {
    setDoc(doc(db, "studies/study1/participants", req.body["subj_id"]), {
      "subj_id":req.body["subj_id"]
    });
    console.log("Document written with ID: " + req.body["subj_id"]);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
})

app.post("/request_trial", urlencodedParser, (req, res) => {
  console.log(req.body)

  try {
    const docRef = setDoc(doc(db, "studies/study1/participants/" + req.body["subj_id"] + "/video_responses", req.body["video"]), req.body["data"]);
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
})

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

export default app;
