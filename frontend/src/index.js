import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    RadialLinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import App from './App';
import 'leaflet/dist/leaflet.css';

ChartJS.register(
    CategoryScale, LinearScale, RadialLinearScale,
    PointElement, LineElement, BarElement, ArcElement,
    Title, Tooltip, Legend, Filler
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render( <
    BrowserRouter >
    <
    App / >
    <
    /BrowserRouter>
);