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
    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(0, 5, 5);
    scene.add(light);

    const ambient = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambient);


    // Canvas and renderer
    const canvas = document.getElementById(canvasId);

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    });


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
        scene.add(gltf.scene);
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