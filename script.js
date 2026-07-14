// 5 SIMPLE TASKS: FILL-IN-THE-BLANKS / FIXING BUGS AT SIMPLE CODING CREATION
const tasksDatabase = [
    {
        id: 1,
        title: "Write a program that gathers music preferences",
        desc: `<b>Task Description:</b><br>
               An integral part of the "A Friend Around" social network is the music section. 
               Write a program that asks you to enter three musical preferences using a loop. 
               After receiving each preference, the program should print: "Preference taken into account". 
               After entering all the preferences, the program prints: "Recommendation system configured!" and exits.<br><br>
               <b>Expected Output Format:</b><br>
               Enter your wish:<br>
               >>> Vivaldi<br>
               Preference taken into account<br>
               ...<br>
               Recommendation system configured!`,
        initialCode: "for i in range(3):\n    # TODO: Ask user input using 'Enter your wish:\\n'\n    \n    # TODO: Print 'Preference taken into account'\n    \n\n# TODO: Print 'Recommendation system configured!'",
        testInputs: ["Vivaldi", "Queen", "Rock"],
        expectedOutputs: ["Preference taken into account", "Recommendation system configured!"]
    },
    {
        id: 2,
        title: "Fix the Bug: Personal Greeting",
        desc: `<b>Task Description:</b><br>
               May mali sa code sa ibaba kaya hindi ito gumagana nang tama. 
               Ayusin ang variable names para kapag nilagay ang pangalan ng user, i-print nito ang tamang greeting.<br><br>
               <b>Expected Output:</b><br>
               Hello, [pangalan]! Welcome back.`,
        initialCode: "username = input('Enter your name: ')\n# BUG: Mali ang variable name na ginamit sa ibaba. Ayusin ito.\nprint('Hello, ' + user + '! Welcome back.')",
        testInputs: ["Mark"],
        expectedOutputs: ["Hello, Mark! Welcome back."]
    },
    {
        id: 3,
        title: "Fix the Bug: Age Verification",
        desc: `<b>Task Description:</b><br>
               Gusto nating i-check kung ang user ay may edad na 18 pataas. 
               May mali sa data type conversion kaya nag-e-error ang code kapag nag-compare gamit ang `>=`. Ayusin ang bug.<br><br>
               <b>Expected Output:</b><br>
               Access granted: True (kung 18 pataas)`,
        initialCode: "# BUG: Kulang ng int() conversion ang input kaya ito nag-e-error\nage = input('Enter your age: ')\nis_legal = age >= 18\nprint('Access granted:', is_legal)",
        testInputs: ["20"],
        expectedOutputs: ["Access granted: True"]
    },
    {
        id: 4,
        title: "Create: Double the Number",
        desc: `<b>Task Description:</b><br>
               Gumawa ng simpleng program na hihingi ng isang numero sa user, 
               at i-print ang value nito kapag pinarami o dinoble (multiplied by 2).<br><br>
               <b>Expected Output:</b><br>
               Result: 20 (kung 10 ang ininput)`,
        initialCode: "num = int(input('Enter a number: '))\n# TODO: Multipliyin ang 'num' sa 2 at i-save sa variable na 'result'\n\nprint('Result:', result)",
        testInputs: ["10"],
        expectedOutputs: ["Result: 20"]
    },
    {
        id: 5,
        title: "Fix the Bug: Free Delivery Check",
        desc: `<b>Task Description:</b><br>
               Ang isang online store ay nagbibigay ng libreng delivery kapag ang kabuuang order (` + "`total`" + `) ay umabot sa 500 pataas. 
               Ayusin ang conditional statement operator (` + "`<`" + `) para maging tama ang logic.<br><br>
               <b>Expected Output:</b><br>
               Free delivery: True (kung 500 pataas)`,
        initialCode: "total = int(input('Enter total checkout amount: '))\n# BUG: Mali ang operator na ginamit sa pag-check ng 500 pataas\nis_free = total < 500 \nprint('Free delivery:', is_free)",
        testInputs: ["600"],
        expectedOutputs: ["Free delivery: True"]
    }
];

let currentTrackIndex = 0;
let highestUnlockedIndex = 0;
let pyodideInstance = null;
let codeEditor = null;

// Control Flow Bridges
let inputPromiseResolver = null;
let isTestingMode = false;
let testInputQueue = [];
let interactiveOutputs = "";
let testingOutputs = "";

// Monaco Editor Config & Markers Setup
require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
require(['vs/editor/editor.main'], function () {
    codeEditor = monaco.editor.create(document.getElementById('editor-container'), {
        language: 'python',
        theme: 'vs-light',
        fontSize: 14,
        automaticLayout: true,
        minimap: { enabled: false },
        renderLineHighlight: 'all'
    });

    codeEditor.onDidChangeModelContent(() => {
        monaco.editor.setModelMarkers(codeEditor.getModel(), 'python', []);
    });

    initializeWorkspaceApp();
});

async function loadPyodideCompiler() {
    pyodideInstance = await loadPyodide();
    initializeWorkspaceApp();
}
loadPyodideCompiler();

function initializeWorkspaceApp() {
    if (pyodideInstance && codeEditor) {
        document.getElementById('runtime-status').innerText = "🟢 System Ready";
        document.getElementById('runtime-status').style.color = "#a6e3a1";
        document.getElementById('run-code-btn').removeAttribute('disabled');
        renderQuestNavigationLayout();
        loadProblemDataPayload(currentTrackIndex);
    }
}

function renderQuestNavigationLayout() {
    const container = document.getElementById('quest-nav');
    container.innerHTML = "";
    tasksDatabase.forEach((task, index) => {
        const dotElement = document.createElement('div');
        dotElement.className = 'dot';
        if (index === currentTrackIndex) {
            dotElement.classList.add('active');
            dotElement.innerText = index + 1;
        } else if (index <= highestUnlockedIndex) {
            dotElement.classList.add('completed');
            dotElement.innerText = index + 1;
            dotElement.onclick = () => jumpToTaskIndex(index);
        } else {
            dotElement.classList.add('locked');
        }
        container.appendChild(dotElement);
    });
}

function loadProblemDataPayload(index) {
    currentTrackIndex = index;
    const task = tasksDatabase[index];
    document.getElementById('task-title').innerHTML = task.title;
    document.getElementById('task-desc').innerHTML = task.desc;
    document.getElementById('success-banner').style.display = 'none';
    clearTerminal();
    codeEditor.setValue(task.initialCode);
    renderQuestNavigationLayout();
    monaco.editor.setModelMarkers(codeEditor.getModel(), 'python', []);
}

function clearTerminal() {
    document.getElementById('terminal-log').innerHTML = "Run your code to see console output logs here...<br>";
    document.getElementById('terminal-input-container').style.display = 'none';
    interactiveOutputs = "";
    testingOutputs = "";
}

function appendToTerminalLog(text) {
    if (isTestingMode) {
        testingOutputs += text;
        return; 
    }
    
    const logSpan = document.getElementById('terminal-log');
    if (logSpan.innerHTML.startsWith("Run your code") || logSpan.innerHTML.startsWith("Running scripts...")) {
        logSpan.innerHTML = text.replace(/\n/g, "<br>");
    } else {
        logSpan.innerHTML += text.replace(/\n/g, "<br>");
    }
    interactiveOutputs += text;
}

function focusTerminalInput() {
    const inputField = document.getElementById('terminal-input-field');
    if (document.getElementById('terminal-input-container').style.display !== 'none') {
        inputField.focus();
    }
}

function handleTerminalSubmit(e) {
    if (e.key === 'Enter') {
        const inputField = document.getElementById('terminal-input-field');
        const value = inputField.value;
        
        const fullPromptText = document.getElementById('terminal-prompt').innerText;
        appendToTerminalLog(fullPromptText + value + "\n");
        
        document.getElementById('terminal-input-container').style.display = 'none';
        inputField.value = "";
        
        if (inputPromiseResolver) {
            inputPromiseResolver(value);
        }
    }
}

function parseAndSetEditorErrors(errorMessage) {
    let lineNumber = 1;
    const lineMatch = errorMessage.match(/File "<string>", line (\d+)/) || errorMessage.match(/line (\d+)/);
    if (lineMatch && lineMatch[1]) {
        lineNumber = parseInt(lineMatch[1], 10);
    }

    const model = codeEditor.getModel();
    monaco.editor.setModelMarkers(model, 'python', [{
        startLineNumber: lineNumber,
        startColumn: 1,
        endLineNumber: lineNumber,
        endColumn: model.getLineMaxColumn(lineNumber),
        message: errorMessage,
        severity: monaco.MarkerSeverity.Error
    }]);
}

function extractImportsAndBody(rawCode) {
    const lines = rawCode.split('\n');
    const globalImports = [];
    const executionBody = [];

    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
            globalImports.push(line);
        } else {
            executionBody.push(line);
        }
    });

    return {
        imports: globalImports.join('\n'),
        body: executionBody.map(line => '    ' + line).join('\n')
    };
}

function prepareCodeForExecution(rawCode) {
    const parsed = extractImportsAndBody(rawCode);
    const rewrittenBody = parsed.body
        .split('\n')
        .map(line => line.replace(/\binput\s*\(/g, 'await patched_input('))
        .join('\n');

    return {
        imports: parsed.imports,
        body: rewrittenBody
    };
}

async function evaluateTaskCode() {
    const code = codeEditor.getValue();
    const logSpan = document.getElementById('terminal-log');
    clearTerminal();
    logSpan.innerHTML = "Running scripts...<br>";
    
    monaco.editor.setModelMarkers(codeEditor.getModel(), 'python', []);

    pyodideInstance.setStdout({ batched: (str) => { appendToTerminalLog(str + "\n"); } });
    pyodideInstance.setStderr({ batched: (str) => { appendToTerminalLog(str + "\n"); } });

    isTestingMode = false;
    try {
        window.promptBridgeEngine = function(msg) {
            document.getElementById('terminal-prompt').innerText = msg;
            document.getElementById('terminal-input-container').style.display = 'flex';
            setTimeout(() => focusTerminalInput(), 50);
            
            return new Promise((resolve) => {
                inputPromiseResolver = resolve;
            });
        };

        // Detect imports of modules not available in Pyodide (e.g., turtle)
        if (/\bimport\s+turtle\b|\bfrom\s+turtle\b/.test(code)) {
            const msg = "Module 'turtle' is not available in this browser Python (Pyodide).\n" +
                "Pyodide removes GUI modules due to browser limitations.\n" +
                "Options: run the code with a local Python install, or rewrite using HTML5 canvas / p5.js / a JS-based drawing library.\n" +
                "See https://pyodide.org/en/stable/usage/loading-packages.html for details.";
            logSpan.innerHTML = `<span class=\"error-text\">Error:\n${msg}</span>`;
            parseAndSetEditorErrors("ModuleNotFoundError: No module named 'turtle' — not available in Pyodide.");
            return;
        }

        const parsed = prepareCodeForExecution(code);

        const complianceWrapper = `
import builtins
import js
${parsed.imports}

async def patched_input(prompt=""):
    return await js.promptBridgeEngine(str(prompt))

builtins.input = patched_input

async def __execute_runtime_sandbox():
${parsed.body || '    pass'}

await __execute_runtime_sandbox()
`;

        await pyodideInstance.runPythonAsync(complianceWrapper);
        await runBackgroundVerificationTests(code);

    } catch (err) {
        logSpan.innerHTML = `<span class="error-text">Error:\n${err.message}</span>`;
        parseAndSetEditorErrors(err.message);
    }
}

async function runBackgroundVerificationTests(studentCode) {
    const targetTask = tasksDatabase[currentTrackIndex];
    isTestingMode = true;
    testingOutputs = "";
    testInputQueue = [...targetTask.testInputs];

    try {
        window.promptBridgeEngine = function() {
            let nextTestInputValue = testInputQueue.shift() || "";
            return Promise.resolve(nextTestInputValue);
        };

        // Prevent running tests if student code imports unsupported modules like turtle
        if (/\bimport\s+turtle\b|\bfrom\s+turtle\b/.test(studentCode)) {
            console.log("Skipping automated tests: 'turtle' is not available in Pyodide.");
            isTestingMode = false;
            return;
        }

        const parsed = prepareCodeForExecution(studentCode);

        const testWrapper = `
import builtins
import js
${parsed.imports}

async def patched_input(prompt=""):
    return await js.promptBridgeEngine(str(prompt))

builtins.input = patched_input

async def __execute_test_sandbox():
${parsed.body || '    pass'}

await __execute_test_sandbox()
`;

        await pyodideInstance.runPythonAsync(testWrapper);
        
        let matchesAll = targetTask.expectedOutputs.every(expected => testingOutputs.trim().includes(expected));
        
        if (matchesAll) {
            document.getElementById('success-banner').style.display = 'block';
            document.getElementById('question-overlay').classList.remove('hidden');
            document.getElementById('toggle-arrow-btn').innerText = "▶";
            if (highestUnlockedIndex === currentTrackIndex && highestUnlockedIndex < tasksDatabase.length - 1) {
                highestUnlockedIndex++;
            }
            renderQuestNavigationLayout();
        }
    } catch (err) {
        console.log("Validation trace ignored: " + err.message);
    } finally {
        isTestingMode = false;
    }
}

// Control function triggers
function loadNextTask() {
    if (currentTrackIndex < tasksDatabase.length - 1) {
        loadProblemDataPayload(currentTrackIndex + 1);
    } else {
        alert("🎉 Modulo completed successfully! Excellent job coding!");
    }
}

function jumpToTaskIndex(index) {
    if (index <= highestUnlockedIndex) {
        loadProblemDataPayload(index);
    }
}

function toggleQuestionOverlay() {
    const overlay = document.getElementById('question-overlay');
    const arrowBtn = document.getElementById('toggle-arrow-btn');
    overlay.classList.toggle('hidden');
    arrowBtn.innerText = overlay.classList.contains('hidden') ? "◀" : "▶";
}

const resizer = document.getElementById('workspace-resizer');
const leftPanel = document.getElementById('left-panel');
const rightArea = document.getElementById('right-panel-area');
const container = document.getElementById('workspace-container');

resizer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    document.addEventListener('mousemove', handlePanelResizeMove);
    document.addEventListener('mouseup', killPanelResizeStream);
});

function handlePanelResizeMove(e) {
    const containerWidth = container.getBoundingClientRect().width;
    let dynamicPercentageWidth = (e.clientX / containerWidth) * 100;
    if (dynamicPercentageWidth > 20 && dynamicPercentageWidth < 80) {
        leftPanel.style.width = `${dynamicPercentageWidth}%`;
        rightArea.style.width = `${100 - dynamicPercentageWidth}%`;
    }
}

function killPanelResizeStream() {
    document.removeEventListener('mousemove', handlePanelResizeMove);
    document.removeEventListener('mouseup', killPanelResizeStream);
}