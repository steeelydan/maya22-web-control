const { execSync } = require('child_process');
const fs = require('fs');
const express = require('express');

const DEFAULT_SETTINGS = {
    headphones: true,
    inputChannel: 'mic_hiz',
    monitor: false,
    inputVolumeL: 86,
    inputVolumeR: 86,
    outputVolume: 145
};

let settings = { ...DEFAULT_SETTINGS };

if (!fs.existsSync('.clipath')) {
    throw new Error('.clipath containing the path to the maya22-control executable not found');
}

const cliPath = fs.readFileSync('.clipath', 'utf-8');

if (!cliPath) {
    throw new Error('.clipath must not be empty');
}

console.log(`Path to the maya22-control executable: ${cliPath}\n`);

const executeMayaCommand = (command) => {
    try {
        const output = execSync(`${cliPath} ${command}`);

        const trimmedOutput = output.toString().trim();

        console.log(trimmedOutput);

        return trimmedOutput;
    } catch (e) {
        return `Error:\n${e.message}`;
    }
};

const saveData = () => {
    fs.writeFileSync('data.json', JSON.stringify(settings, null, 4));
};

const reset = () => {
    const output = executeMayaCommand('-d');

    settings = { ...DEFAULT_SETTINGS };

    saveData();

    console.log('\nDefault values loaded and submitted to device\n');

    return output;
};

// Enumerate devices at startup
console.log('Device:');
const deviceEnumerationResult = executeMayaCommand('-e');
console.log();

if (deviceEnumerationResult.includes('is empty')) {
    throw new Error('Maya 22 interface seems to be disconnected');
}

if (!fs.existsSync(cliPath)) {
    throw new Error('maya22-control executable not found.');
}

if (fs.existsSync('data.json')) {
    settings = JSON.parse(fs.readFileSync('data.json', 'utf-8'));

    console.log('Settings loaded from data.json\n');
} else {
    reset();
}

const app = express();

app.use(express.json());
app.use(express.static('public'));

app.get('/settings', (req, res) => {
    res.json(settings);
});

app.post('/setting', (req, res) => {
    const setting = req.body.setting;
    const value = req.body.value;

    if (
        !(
            value === true ||
            value === false ||
            ['mic', 'hiz', 'line', 'mic_hiz', 'mute'].includes(value) ||
            Number.isInteger(value)
        ) ||
        !/^[a-zA-Z]+$/.test(setting)
    ) {
        return res.status(400).send();
    }

    let output;

    /*
        -e          - Enumerate available devices
        -i          - Enable headphone
        -d          - Set default values
        -c <name>   - Set input channel ('mic', 'hiz', 'line', 'mic_hiz', 'mute')
        -M          - Input monitoring on
        -m          - Input monitoring off
        -l <0-127>  - Input left volume
        -r <0-127>  - Input right volume
        -L <0-145>  - Output left volume
        -R <0-145>  - Output right volume
    */

    switch (setting) {
        case 'inputChannel': {
            output = executeMayaCommand(`-c ${value}`);
            break;
        }
        case 'monitor': {
            if (!!value) {
                output = executeMayaCommand(`-M`);
            } else {
                output = executeMayaCommand(`-m`);
            }

            break;
        }
        case 'inputVolumeL': {
            output = executeMayaCommand(`-l ${value}`);
            break;
        }
        case 'inputVolumeR': {
            output = executeMayaCommand(`-r ${value}`);
            break;
        }
        case 'outputVolume': {
            output = executeMayaCommand(`-L ${value} -R ${value}`);
            break;
        }
        default: {
            console.error(`Setting does not exist: ${setting}`);

            return res.status(400).json({ output: `Setting does not exist: ${setting}` });
        }
    }

    settings[setting] = value;

    saveData();

    res.json({ output });
});

app.post('/reset', (req, res) => {
    const output = reset();

    res.json({ output: output });
});

app.listen('9999', '127.0.0.1', () => {
    console.log('Open http://localhost:9999\n');
});
