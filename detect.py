import sys
import json
import os

try:
    from ultralytics import YOLO
    import cv2
except ImportError:
    print(json.dumps({"error": "Please install required packages: pip install ultralytics opencv-python"}))
    sys.exit(1)

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided."}))
        sys.exit(1)

    image_path = sys.argv[1]
    
    # Path to the model
    # Assuming models directory is in the same directory as this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(script_dir, 'models', 'road_damage_yolov8_best.pt')

    if not os.path.exists(model_path):
        print(json.dumps({"error": f"Model not found at {model_path}"}))
        sys.exit(1)

    try:
        # Load a model
        model = YOLO(model_path)
        
        # Run inference
        results = model(image_path, verbose=False)
        
        detections = []
        for result in results:
            boxes = result.boxes
            for box in boxes:
                # get box coordinates in (left, top, right, bottom) format
                b = box.xyxy[0].tolist() 
                conf = box.conf[0].item()
                cls = int(box.cls[0].item())
                name = model.names[cls]
                
                detections.append({
                    "box": b,
                    "confidence": conf,
                    "class": name
                })
                
        # Draw on image and save it as output image
        output_filename = "predicted_" + os.path.basename(image_path)
        output_path = os.path.join(script_dir, 'uploads', output_filename)
        
        # Save the image with boxes
        for r in results:
            im_array = r.plot()  # plot a BGR numpy array of predictions
            cv2.imwrite(output_path, im_array)

        # Output JSON result
        response = {
            "success": True,
            "detections": detections,
            "output_image": f"/uploads/{output_filename}"
        }
        
        print(json.dumps(response))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
