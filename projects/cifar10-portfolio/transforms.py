import torchvision.transforms as transforms


cifar10_transform = transforms.Compose([
    transforms.Resize((32, 32)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=(0.4914, 0.4822, 0.4465),
        std=(0.2470, 0.2435, 0.2616)
    )
])


def transform_image(image):
    image = cifar10_transform(image)
    image = image.unsqueeze(0)
    return image