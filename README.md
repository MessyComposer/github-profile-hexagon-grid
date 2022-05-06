# Hexagon Grid

## How to use

1. In your repository, add the hex-grid tags to your **README.md** file, eg.
    ```markdown
    <!-- HEX-GRID:IMAGES [
        "cpp",
        "node",
        {
            "url": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg",
            "hex": true,
            "bg_fill": "#ffffff80"
        },
    ] -->
    <!-- HEX-GRID:EFFECTS   ["glitch"] -->
    <!-- HEX-GRID:TRANSITIONS ["scale-in"] -->
    <!-- HEX-GRID:START --><!-- HEX-GRID:END -->
    ```
    
1. Create a new workflow file
    ```yaml
    name: Generate Hexagon Grid
    on:
      workflow_dispatch:
    jobs:
      update-readme:
        name: Update Readme
        runs-on: ubuntu-latest
        steps:
          - name: Checkout
            uses: actions/checkout@v2
          - name: Generate Grid
            uses: MessyComposer/github-profile-hexagon@main
    ```
    
1. Trigger the workflow