import os
import yaml

class ConfigLoader:
    def __init__(self, workspace_root=None):
        if workspace_root is None:
            # Default to the parent of the parent of this file (since this is core/config_loader.py)
            self.workspace_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        else:
            self.workspace_root = workspace_root

        self.config_dir = os.path.join(self.workspace_root, "config")
        self.settings_path = os.path.join(self.config_dir, "settings.yaml")
        self.properties_path = os.path.join(self.config_dir, "properties.yaml")

    def load_settings(self):
        if not os.path.exists(self.settings_path):
            raise FileNotFoundError(f"Settings file not found at: {self.settings_path}")
        with open(self.settings_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)

    def load_properties(self):
        if not os.path.exists(self.properties_path):
            raise FileNotFoundError(f"Properties file not found at: {self.properties_path}")
        with open(self.properties_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)

    def get_property(self, property_id):
        properties = self.load_properties()
        if property_id not in properties:
            raise KeyError(f"Property with ID '{property_id}' not found in database.")
        return properties[property_id]
