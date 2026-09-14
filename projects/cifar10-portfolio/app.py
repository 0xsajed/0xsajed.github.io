import streamlit as st
import torch
from PIL import Image
from pathlib import Path

from model import ConvNet
from transforms import transform_image
from class_names import class_names

MODEL_PATH = Path(__file__).resolve().parent / "model.pth"


@st.cache_resource
def load_model():
    model = ConvNet()
    model = torch.load(MODEL_PATH, map_location="cpu", weights_only=False)
    model.eval()
    return model

st.title("CIFAR-10 Image Classifier")

st.write("""
Upload an image and the model will classify it as one of the CIFAR-10 classes.
This is a portfolio adaptation of a university machine learning project.
""")

st.write("""The image has to be a picture of one of the following:
airplace, automobile, bird, cat, deer, dog, frog, horse, ship, or truck.""")

uploaded_file = st.file_uploader(
    "Upload an image",
    type=["jpg", "jpeg", "png"]
)

if uploaded_file is not None:
    image = Image.open(uploaded_file).convert("RGB")

    st.image(image, caption="Uploaded image", width="stretch")

    model = load_model()
    image_tensor = transform_image(image)

    with torch.no_grad():
        output = model(image_tensor)
        probabilities = torch.softmax(output, dim=1)
        confidence, predicted = torch.max(probabilities, 1)

    predicted_class = class_names[predicted.item()]

    st.subheader("Prediction")
    st.write(f"Class: **{predicted_class}**")
    st.write(f"Confidence: **{confidence.item() * 100:.2f}%**")