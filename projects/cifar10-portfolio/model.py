import torch.nn as nn
import torch

# set up the model
class ConvNet(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()

        # input: [batch, 3, 32, 32]
        # output: [batch, 64, 32, 32]
        # begin the first feature block without reducing spatial resolution
        self.layer1 = nn.Sequential(
            nn.Conv2d(
                in_channels=3,
                out_channels=64,
                kernel_size=3,
                stride=1,
                padding=1
            ),
            nn.BatchNorm2d(64),
            nn.ReLU()
        )

        # output: [batch, 64, 16, 16]
        # finish the first block by halving the image resolution
        self.layer2 = nn.Sequential(
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2)
        )

        # output: [batch, 128, 16, 16]
        # double the channel count after the first pooling operation
        self.layer3 = nn.Sequential(
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU()
        )

        # output: [batch, 128, 8, 8]
        # finish the second block with another max-pooling operation
        self.layer4 = nn.Sequential(
            nn.Conv2d(128, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2)
        )

        # output: [batch, 256, 8, 8]
        # increase feature depth to 256 channels in the final block
        self.layer5 = nn.Sequential(
            nn.Conv2d(128, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU()
        )

        # output: [batch, 256, 4, 4]
        # reduce the final feature maps to a 4 by 4 spatial grid
        self.layer6 = nn.Sequential(
            nn.Conv2d(256, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2)
        )

        # average each 4 × 4 feature map into one value.
        # output: [batch, 256, 1, 1]
        self.global_pool = nn.AdaptiveAvgPool2d((1, 1))

        # the only fully connected layer.
        self.fc = nn.Linear(256, num_classes)

    def forward(self, x):
        # apply the six convolutional layers in sequence
        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)
        x = self.layer5(x)
        x = self.layer6(x)
        
        # collapse each final feature map to one value
        x = self.global_pool(x)
        x = torch.flatten(x, start_dim=1)
        # produce one unnormalised score for each class
        x = self.fc(x)

        # return logits because cross-entropy applies softmax internally
        return x