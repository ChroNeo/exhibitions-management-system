import Quill from "quill";

const DEFAULT_TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["link"],
  ["clean"],
] as const;

function resetContainer(container: HTMLElement) {
  container.innerHTML = "";
  container.removeAttribute("class");
  container.removeAttribute("style");
  container.removeAttribute("tabindex");
  container.removeAttribute("data-gramm");
  container.removeAttribute("contenteditable");
  container.removeAttribute("role");
}

function removeToolbar(wrapper: Element | null | undefined) {
  if (!wrapper) return;
  wrapper.querySelectorAll(".ql-toolbar").forEach((node) => {
    if (node instanceof HTMLElement) {
      node.remove();
    }
  });
}

type InitializeRichTextEditorOptions = {
  container: HTMLElement;
  placeholder?: string;
};

export function initializeRichTextEditor({
  container,
  placeholder,
}: InitializeRichTextEditorOptions) {
  const wrapper = container.parentElement;
  removeToolbar(wrapper);
  resetContainer(container);

  const quill = new Quill(container, {
    theme: "snow",
    modules: { toolbar: DEFAULT_TOOLBAR_OPTIONS },
    placeholder,
  });

  const cleanup = () => {
    removeToolbar(wrapper);
    resetContainer(container);
  };

  return { quill, cleanup };
}

export type { Quill };
