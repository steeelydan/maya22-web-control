let changeSettingsTimeout = null;
let debugEl = null;

const log = (text) => {
    debugEl.innerText += `${new Date().toISOString().slice(11, 19)} ${text}\n`;
    debugEl.scrollTo(0, debugEl.scrollHeight);
};

const setElementValue = (id, value) => {
    const el = document.getElementById(id);
    const valueEl = document.getElementById(`${id}-value`);

    el.value = value;

    if (valueEl) {
        valueEl.innerText = value;
    }
};

const mayaSettingsRequest = (setting) => {
    if (changeSettingsTimeout) {
        clearTimeout(changeSettingsTimeout);
    }

    changeSettingsTimeout = setTimeout(async () => {
        const response = await fetch('/setting', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                setting: setting.setting,
                value: setting.value,
            }),
        });

        const result = await response.json();

        log(result.output);
    }, 20);
};

const registerRangeInput = (id, settingsFunction) => {
    const el = document.getElementById(id);
    const valueEl = document.getElementById(`${id}-value`);

    el.addEventListener('input', (event) => {
        mayaSettingsRequest(settingsFunction(event.target.value));
        valueEl.innerText = event.target.value;
    });
};

const registerSelectbox = (id, settingsFunction) => {
    const el = document.getElementById(id);

    el.addEventListener('input', (event) => {
        mayaSettingsRequest(settingsFunction(event.target.value));
    });
};

const getSavedSettings = async () => {
    const settingsResponse = await fetch('/settings');

    if (settingsResponse.ok) {
        const settings = await settingsResponse.json();

        for (let [key, value] of Object.entries(settings)) {
            if (
                [
                    'inputVolumeL',
                    'inputVolumeR',
                    'outputVolume',
                    'inputChannel',
                ].includes(key)
            ) {
                setElementValue(key, value);
            }
        }
    }
};

window.addEventListener('DOMContentLoaded', async (event) => {
    debugEl = document.getElementById('debug');

    const resetButtonEl = document.getElementById('reset');

    resetButtonEl.addEventListener('click', async () => {
        const response = await fetch('/reset', {
            method: 'POST',
        });

        if (response.ok) {
            const body = await response.json();

            log(body.output);

            getSavedSettings();
        }
    });

    registerSelectbox('inputChannel', (value) => ({
        setting: 'inputChannel',
        value: value,
    }));
    registerRangeInput('inputVolumeL', (value) => ({
        setting: 'inputVolumeL',
        value: parseInt(value),
    }));
    registerRangeInput('inputVolumeR', (value) => ({
        setting: 'inputVolumeR',
        value: parseInt(value),
    }));
    registerRangeInput('outputVolume', (value) => ({
        setting: 'outputVolume',
        value: parseInt(value),
    }));

    await getSavedSettings();
});
