"""
Training script for custom drink detection model using YOLOv8.

Usage:
    python train.py                          # Train from scratch
    python train.py --resume                 # Resume training
    python train.py --epochs 200 --batch 32  # Custom params
"""

import argparse
from pathlib import Path

from ultralytics import YOLO


def train(args):
    dataset_yaml = Path(__file__).parent / "dataset.yaml"

    if not dataset_yaml.exists():
        print(f"Error: {dataset_yaml} not found")
        return

    # Start with pretrained YOLOv8 and fine-tune on drink data
    model = YOLO(args.model)

    results = model.train(
        data=str(dataset_yaml),
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        patience=args.patience,
        save=True,
        project=str(Path(__file__).parent.parent / "runs"),
        name="drink_detector",
        exist_ok=True,
        # Augmentation
        augment=True,
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        degrees=10,
        translate=0.1,
        scale=0.5,
        fliplr=0.5,
        mosaic=1.0,
        mixup=0.1,
    )

    # Export best model
    best_model_path = Path(__file__).parent.parent / "runs" / "drink_detector" / "weights" / "best.pt"
    target_path = Path(__file__).parent.parent / "backend" / "models" / "drink_detector.pt"
    target_path.parent.mkdir(parents=True, exist_ok=True)

    if best_model_path.exists():
        import shutil
        shutil.copy2(best_model_path, target_path)
        print(f"\nBest model copied to: {target_path}")

    # Validate
    metrics = model.val()
    print(f"\nmAP50: {metrics.box.map50:.4f}")
    print(f"mAP50-95: {metrics.box.map:.4f}")

    return results


def main():
    parser = argparse.ArgumentParser(description="Train drink detection model")
    parser.add_argument("--model", default="yolov8n.pt", help="Base model")
    parser.add_argument("--epochs", type=int, default=100, help="Training epochs")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size")
    parser.add_argument("--patience", type=int, default=20, help="Early stopping patience")
    parser.add_argument("--resume", action="store_true", help="Resume training")
    args = parser.parse_args()

    if args.resume:
        last_path = Path(__file__).parent.parent / "runs" / "drink_detector" / "weights" / "last.pt"
        if last_path.exists():
            args.model = str(last_path)
            print(f"Resuming from: {last_path}")
        else:
            print("No checkpoint found, starting fresh.")

    train(args)


if __name__ == "__main__":
    main()
