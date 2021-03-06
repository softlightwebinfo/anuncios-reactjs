import next from 'next'
import express from 'express';
import * as path from "path";
// @ts-ignore
import cookieParser from "cookie-parser";
// @ts-ignore
import bodyParser from "body-parser";
import { AuthService } from "./serverSrc/clients/AuthService";
// CONFIGS
// let storage = multer.diskStorage({
//     destination: function (_, __, callback) {
//         callback(null, './public/images');
//     },
//     filename: function (req, file, callback) {
//         const ext = path.extname(file.originalname);
//         const name = file.fieldname + '-' + Date.now() + ext;
//         req.filename = name;
//         callback(null, name);
//     },
// });
// let upload = multer({storage: storage}).single('file');
// let uploadMultiple = multer({storage: storage}).array('file', 10);

const routes = require("./routes");
const app = next({dev: process.env.NODE_ENV !== 'production'});
const handler = routes.getRequestHandler(app);
// SERVER AND IO SOCKET
let serverExpress = express();

const server = require('http').createServer(serverExpress);
const io = require('socket.io')(server);

io.on("connection", function (_socket) {
    console.log("Made socket connection");
});
// With express
app.prepare().then(() => {
    serverExpress.use(express.json());
    serverExpress.use(cookieParser());
    serverExpress.use(bodyParser.json());
    serverExpress.use(bodyParser.urlencoded({extended: false}));
    serverExpress.use(express.static(path.join(__dirname, 'public')));
    serverExpress.use(function (req, _, next) {
        // @ts-ignore
        req.io = io;
        next();
    })

    serverExpress.post("/api/auth/validate", (req, res) => {
        AuthService.runService('VerifyAuth', {
            token: req.body.token,
        }, (e, resp) => {
            if (e) {
                return res.status(500).json({error: e.toString(), data: {}})
            }
            return res.json(resp);
        });
    });

    serverExpress.use(handler);
    server.listen(3000);
});