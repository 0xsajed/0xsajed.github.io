function applyWireframeToObject(root, enabled) {
    root.traverse(function (object) {
        if (!object.isMesh) {
            return;
        }

        const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];

        materials.forEach(function (material) {
            if (!material) {
                return;
            }

            material.wireframe = enabled;
            material.needsUpdate = true;
        });
    });
}


function setCubeWireframe(viewer, enabled) {
    viewer.wireframeEnabled = Boolean(enabled);
    applyWireframeToObject(
        viewer.model,
        viewer.wireframeEnabled
    );

    return viewer.wireframeEnabled;
}


function toggleCubeWireframe(viewer) {
    return setCubeWireframe(
        viewer,
        !viewer.wireframeEnabled
    );
}


async function createCubeViewer(canvasId, modelPath) {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
        60,
        1,
        0.1,
        1000
    );

    camera.position.set(15, 15, 13);

    // Lighting
    // Lighting
const hemisphereLight = new THREE.HemisphereLight(
    0xffffff,
    0x777777,
    0.8
);
scene.add(hemisphereLight);

const keyLight = new THREE.DirectionalLight(
    0xffffff,
    0.9
);
keyLight.position.set(8, 10, 10);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(
    0xffffff,
    0.5
);
fillLight.position.set(-8, 5, -8);
scene.add(fillLight);

// Illuminates the bottom faces.
const lowerLight = new THREE.DirectionalLight(
    0xffffff,
    0.4
);
lowerLight.position.set(2, -10, 6);
scene.add(lowerLight);

// Prevents faces pointing away from every light becoming black.
const ambientLight = new THREE.AmbientLight(
    0xffffff,
    0.25
);
scene.add(ambientLight);

    // Canvas and renderer
    const canvas = document.getElementById(canvasId);

    if (!canvas) {
        throw new Error(`Canvas not found: ${canvasId}`);
    }

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;

    // Mouse controls
    const controls = new THREE.OrbitControls(
        camera,
        renderer.domElement
    );

    controls.target.set(0, 0, 0);
    controls.update();

    // Responsive canvas
    function resize() {
        const width = canvas.clientWidth;
        const height = width;

        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    resize();
    window.addEventListener("resize", resize);

    // Load model
    const loader = new THREE.GLTFLoader();
    const gltf = await loader.loadAsync(modelPath);
    const model = gltf.scene;

if (modelPath.includes("mirror")) {
    model.traverse(function (object) {
        if (!object.isMesh) {
            return;
        }

        const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];

        materials.forEach(function (material) {
            if (!material) {
                return;
            }

            material.color.set(0x777777);
            material.metalness = 0.85;
            material.roughness = 0.12;
            material.needsUpdate = true;
        });
    });
}

    scene.add(model);

    // Find cubies and read their logical coordinates
    const cubies = [];

    model.traverse(function (object) {
        const match = object.name.match(
            /^cubie_(-?1|0)_(-?1|0)_(-?1|0)$/
        );

        if (!match) {
            return;
        }

        object.userData.gridPosition = {
            x: Number(match[1]),
            y: Number(match[2]),
            z: Number(match[3])
        };

        cubies.push(object);
    });

    console.log(`Cubies found: ${cubies.length}`);

    if (cubies.length !== 26) {
        console.warn(
            `Expected 26 cubies, but found ${cubies.length}.`
        );
    }

    // Store the solved transform of every cubie.
    const initialCubieStates = cubies.map(function (cubie) {
        return {
            cubie,
            parent: cubie.parent,
            position: cubie.position.clone(),
            quaternion: cubie.quaternion.clone(),
            scale: cubie.scale.clone(),
            gridPosition: {
                ...cubie.userData.gridPosition
            }
        };
    });

    // Render loop
    function animate() {
        requestAnimationFrame(animate);

        controls.update();
        renderer.render(scene, camera);
    }

    animate();

    // Make these available to the animation system
    return {
        scene,
        camera,
        renderer,
        controls,
        model,
        cubies,
        initialCubieStates,
        modelPath,
        wireframeEnabled: false
    };
}


function resetCubeViewer(viewer) {
    if (viewer.animationInProgress) {
        throw new Error(
            "Cannot reset while an animation is running."
        );
    }

    viewer.initialCubieStates.forEach(function (state) {
        state.parent.attach(state.cubie);

        state.cubie.position.copy(state.position);
        state.cubie.quaternion.copy(state.quaternion);
        state.cubie.scale.copy(state.scale);

        state.cubie.userData.gridPosition = {
            ...state.gridPosition
        };

        state.cubie.updateMatrix();
    });

    viewer.model.updateMatrixWorld(true);
}

async function replaceCubeModel(viewer, modelPath) {
    if (viewer.animationInProgress) {
        throw new Error(
            "Cannot change cube during an animation."
        );
    }

    const loader = new THREE.GLTFLoader();
    const gltf = await loader.loadAsync(modelPath);
    const newModel = gltf.scene;

    if (modelPath.includes("mirror")) {
    newModel.traverse(function (object) {
        if (!object.isMesh) {
            return;
        }

        const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];

        materials.forEach(function (material) {
            if (!material) {
                return;
            }

            material.color.set(0x777777);
            material.metalness = 0.85;
            material.roughness = 0.12;
            material.needsUpdate = true;
        });
    });
}

    const cubies = [];

    newModel.traverse(function (object) {
        const match = object.name.match(
            /^cubie_(-?1|0)_(-?1|0)_(-?1|0)$/
        );

        if (!match) {
            return;
        }

        object.userData.gridPosition = {
            x: Number(match[1]),
            y: Number(match[2]),
            z: Number(match[3])
        };

        cubies.push(object);
    });

    if (cubies.length !== 26) {
        throw new Error(
            `The selected model contains ${cubies.length} named cubies instead of 26.`
        );
    }

    viewer.scene.remove(viewer.model);
    viewer.scene.add(newModel);

    applyWireframeToObject(
        newModel,
        viewer.wireframeEnabled
    );

    const initialCubieStates = cubies.map(function (cubie) {
        return {
            cubie,
            parent: cubie.parent,
            position: cubie.position.clone(),
            quaternion: cubie.quaternion.clone(),
            scale: cubie.scale.clone(),
            gridPosition: {
                ...cubie.userData.gridPosition
            }
        };
    });

    viewer.model = newModel;
    viewer.cubies = cubies;
    viewer.initialCubieStates = initialCubieStates;
    viewer.modelPath = modelPath;

    newModel.updateMatrixWorld(true);

    console.log(
        `Loaded ${modelPath}. Cubies found: ${cubies.length}`
    );
}
