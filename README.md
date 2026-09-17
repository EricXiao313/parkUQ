# ParkUQ DECO2500 Interactive Prototype

A self-contained interactive web prototype based on the group's parking concept for UQ / St Lucia.

## Run it

The simplest option is to open `index.html` in a browser.

For the most reliable local preview, run a local server from this folder:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Implemented interactions

- Landing-page destination search
- Map/list parking results
- Price, duration, distance and availability filters
- Parking detail page
- Preferences saved with localStorage
- Dashboard / recent searches
- Responsive mobile layout
- Simulated map pins, availability and directions interaction

## Prototype limitation

All parking availability and some parking details are sample prototype data. No live UQ / Council / PayStay API is connected.
