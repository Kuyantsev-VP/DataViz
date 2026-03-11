# DataViz

Desktop-style web application for visualizing and analyzing sensor data graphs from CSV files.

Built with React + Vite + TypeScript + uPlot.

## Prerequisites

You need **Node.js** (v18+) and **npm** installed.

### Linux (Ubuntu / Debian)

```bash
# Option 1: via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Option 2: via nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 20
```

### Windows

**Option 1: Installer**

Download and run the LTS installer from [https://nodejs.org](https://nodejs.org). Follow the wizard — npm is included.

**Option 2: winget**

```powershell
winget install OpenJS.NodeJS.LTS
```

**Option 3: nvm-windows**

Download [nvm-windows](https://github.com/coreybutler/nvm-windows/releases), then:

```powershell
nvm install 20
nvm use 20
```

### Verify installation

```bash
node -v    # should print v18.x or higher
npm -v     # should print 9.x or higher
```

## Installation

```bash
cd app
npm install
```

## Running the dev server

```bash
cd app
npm run dev
```

The app will be available at `http://localhost:5173`. It is also accessible from the local network (bound to `0.0.0.0`).

## Production build

```bash
cd app
npm run build
npm run preview
```

## Usage

1. **Load data** — drag & drop a `.csv` or `.txt` file onto the drop zone, or click to browse. An import wizard will open where you can toggle, rename, and recolor columns before loading.
2. **Navigate** — edit axis min/max values by clicking on them. Use the X-axis scrollbar to pan when zoomed in. Adjust Y-axis offset for each scale.
3. **Tooltip** — right-click and hold on the graph to see interpolated values at the cursor position. Enable always-on tooltip in Settings.
4. **Legend** — toggle series visibility via checkboxes in the header.
5. **Notes** — click the notebook icon to add session notes.
6. **Settings** — click the gear icon to change theme, toggle always-on tooltip, rename series, or pick custom colors.
7. **Export/Import** — use the arrow buttons in the header to export the session as a `.zip` archive or import a previously exported one.
8. **Auto-save** — the session is automatically saved to IndexedDB. On next launch you will be prompted to resume or start fresh.

## CSV format

- Comma-separated, headers in the first row.
- Must contain a `Time` column with sorted, unique numeric values.
- All other columns are treated as data series.

Example:

```
Time,Temperature,Pressure,Humidity
0,22.5,1013.2,45.1
0.5,22.6,1013.1,45.3
1.0,22.8,1013.0,45.5
```
