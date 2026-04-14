"""
Data preparation utilities for drink detection training.
Helps collect and organize images into the required YOLO format.

Usage:
    python prepare_data.py --source ./raw_images --output ../datasets/drinks
"""

import argparse
import random
import shutil
from pathlib import Path


def create_dataset_structure(output_dir: Path):
    """Create the YOLO dataset directory structure."""
    for split in ["train", "val", "test"]:
        (output_dir / "images" / split).mkdir(parents=True, exist_ok=True)
        (output_dir / "labels" / split).mkdir(parents=True, exist_ok=True)
    print(f"Created dataset structure at: {output_dir}")


def split_data(source_dir: Path, output_dir: Path, train_ratio=0.7, val_ratio=0.2):
    """Split images and labels into train/val/test sets."""
    image_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    images = [f for f in source_dir.iterdir() if f.suffix.lower() in image_extensions]
    random.shuffle(images)

    n_total = len(images)
    n_train = int(n_total * train_ratio)
    n_val = int(n_total * val_ratio)

    splits = {
        "train": images[:n_train],
        "val": images[n_train:n_train + n_val],
        "test": images[n_train + n_val:],
    }

    for split_name, split_images in splits.items():
        for img_path in split_images:
            # Copy image
            dest_img = output_dir / "images" / split_name / img_path.name
            shutil.copy2(img_path, dest_img)

            # Copy label if exists
            label_path = img_path.with_suffix(".txt")
            if label_path.exists():
                dest_label = output_dir / "labels" / split_name / label_path.name
                shutil.copy2(label_path, dest_label)

        print(f"{split_name}: {len(split_images)} images")

    print(f"\nTotal: {n_total} images split into train/val/test")


def convert_voc_to_yolo(xml_dir: Path, output_dir: Path, class_names: list[str]):
    """Convert Pascal VOC annotations to YOLO format."""
    import xml.etree.ElementTree as ET

    class_map = {name: idx for idx, name in enumerate(class_names)}

    for xml_file in xml_dir.glob("*.xml"):
        tree = ET.parse(xml_file)
        root = tree.getroot()

        size = root.find("size")
        img_w = int(size.find("width").text)
        img_h = int(size.find("height").text)

        yolo_lines = []
        for obj in root.findall("object"):
            cls_name = obj.find("name").text
            if cls_name not in class_map:
                continue

            bbox = obj.find("bndbox")
            xmin = int(bbox.find("xmin").text)
            ymin = int(bbox.find("ymin").text)
            xmax = int(bbox.find("xmax").text)
            ymax = int(bbox.find("ymax").text)

            # Convert to YOLO format (center_x, center_y, width, height) normalized
            cx = (xmin + xmax) / 2.0 / img_w
            cy = (ymin + ymax) / 2.0 / img_h
            w = (xmax - xmin) / img_w
            h = (ymax - ymin) / img_h

            cls_id = class_map[cls_name]
            yolo_lines.append(f"{cls_id} {cx:.6f} {cy:.6f} {w:.6f} {h:.6f}")

        # Write YOLO label file
        label_file = output_dir / xml_file.with_suffix(".txt").name
        label_file.write_text("\n".join(yolo_lines))

    print(f"Converted {len(list(xml_dir.glob('*.xml')))} annotations to YOLO format")


def main():
    parser = argparse.ArgumentParser(description="Prepare drink detection dataset")
    parser.add_argument("--source", type=str, required=True, help="Source directory with images/labels")
    parser.add_argument("--output", type=str, default="../datasets/drinks", help="Output dataset directory")
    parser.add_argument("--train-ratio", type=float, default=0.7)
    parser.add_argument("--val-ratio", type=float, default=0.2)
    parser.add_argument("--create-only", action="store_true", help="Only create directory structure")
    args = parser.parse_args()

    output_dir = Path(args.output)

    if args.create_only:
        create_dataset_structure(output_dir)
        return

    create_dataset_structure(output_dir)
    split_data(Path(args.source), output_dir, args.train_ratio, args.val_ratio)


if __name__ == "__main__":
    main()
