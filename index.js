import express from 'express';
import router from './routes/router.js'
import { engine } from 'express-handlebars';
import cookieParser from 'cookie-parser';
const app = express();
const PORT = process.env.PORT || 3000;

//carpeta publica
app.use(express.static('public'));

//motor de plantilla
app.engine('hbs', engine({
    extname: '.hbs',
}));
app.set('view engine', 'hbs');
app.set('views', './views');

//middlewares
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//routes
app.use('/', router);

//server
app.listen(PORT, console.log(`🔥Server running on port ${PORT}🔥`));

