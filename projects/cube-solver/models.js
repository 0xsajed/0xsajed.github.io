function createModelViewer(canvasId, modelPath) {

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
        60,
        1,
        0.1,
        1000
    );

    camera.position.set(15, 15, 13);


    // Lighting
    const hemisphereLight = new THREE.HemisphereLight(
        0xffffff,
        0x777777,
        0.8
    );
    scene.add(hemisphereLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
    keyLight.position.set(8, 10, 10);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-8, 5, -8);
    scene.add(fillLight);

    const lowerLight = new THREE.DirectionalLight(0xffffff, 0.4);
    lowerLight.position.set(2, -10, 6);
    scene.add(lowerLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambientLight);


    // Canvas and renderer
    const canvas = document.getElementById(canvasId);

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;

    // Set canvas size
    function resize() {
        const width = canvas.clientWidth;
        const height = width;

        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    resize();


    // Load model
    const loader = new THREE.GLTFLoader();

    loader.load(modelPath, function(gltf) {
        const model = gltf.scene;

        if (modelPath.includes("mirror")) {
            model.traverse(function(object) {
                if (!object.isMesh) {
                    return;
                }

                const materials = Array.isArray(object.material)
                    ? object.material
                    : [object.material];

                materials.forEach(function(material) {
                    if (!material) {
                        return;
                    }

                    material.color.set(0x777777);

                    if ("metalness" in material) {
                        material.metalness = 0.85;
                    }

                    if ("roughness" in material) {
                        material.roughness = 0.12;
                    }

                    material.needsUpdate = true;
                });
            });
        }

        scene.add(model);
    });


    // Mouse controls
    const controls = new THREE.OrbitControls(
        camera,
        renderer.domElement
    );


    // Render loop
    function animate() {
        requestAnimationFrame(animate);

        controls.update();
        renderer.render(scene, camera);
    }

    animate();


    // Resize when browser window changes
    window.addEventListener("resize", resize);
}


// Create the three model viewers
createModelViewer(
    "cubeCanvas",
    "models/regular.glb"
);

createModelViewer(
    "mastermorphixCanvas",
    "models/mastermorphix.glb"
);

createModelViewer(
    "mirrorCanvas",
    "models/mirror.glb"
);