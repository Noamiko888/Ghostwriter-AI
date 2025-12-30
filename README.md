# Ghostwriter AI

Ghostwriter AI is a magical writing experience where artificial intelligence serves as a true thought partner. It helps you generate initial drafts, provides proactive suggestions, and allows you to iterate on your text inline until it's perfect.

## Features

- **Initial Draft Generation**: Create structured drafts for various platforms (Generic, LinkedIn, Twitter, etc.) based on prompts and optional file attachments.
- **Proactive Suggestions**: The AI analyzes your text as you write (or after drafts are generated) and offers actionable improvements for clarity, tone, and grammar.
- **Inline Editing**: Apply AI suggestions with a single click, automatically weaving them into your text.
- **Revision History**: Keep track of your draft iterations.
- **Undo/Redo**: Full undo and redo support for your manual edits.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **AI**: Google Gemini API (`gemini-2.5-pro` for reasoning and generation)
- **Build Tool**: Vite (implied by file structure)

## Setup and Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd ghostwriter-ai
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure API Key**:
    *   **Important**: This application requires a valid Google Gemini API key.
    *   Create a `.env` file in the root of your project.
    *   Add your API key to the file:
        ```
        API_KEY=your_actual_api_key_here
        ```
    *   **Security Note**: Never commit your `.env` file or your API keys to version control. The `.gitignore` file should include `.env`.

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

5.  Open your browser to the URL provided by the CLI (usually `http://localhost:5173`).

## Usage

1.  **Start Writing**: Enter a topic or upload a context file on the initial screen. Select your target platform.
2.  **Review**: Once the draft is generated, read through it in the editor.
3.  **Edit**: Type directly in the editor to make manual changes. You can Undo/Redo these changes using the toolbar buttons or standard keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z).
4.  **Improve**: Watch for suggestions appearing in the sidebar. Hover over them to see the context in your text. Click to select suggestions you like.
5.  **Iterate**: Click "Generate New Revision" to have the AI rewrite the document incorporating your selected suggestions.
