import '../sass/main.scss';
// Bootstrap's JavaScript: needed for the navbar toggler and the cart offcanvas
import { Offcanvas } from 'bootstrap';
import './fe26-shop.js';

// Following a link inside the cart (#checka-ut) should close the cart
addEventListener('hashchange', () => Offcanvas.getInstance('#cartPanel')?.hide());
