export const downloadMedia = async (url: string) => {
    if (!url) return;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Network response not ok");
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        try {
            const pathname = new URL(url).pathname;
            a.download = pathname.split("/").pop() || "video.mp4";
        } catch (e) {
            a.download = "video.mp4";
        }
        document.body.appendChild(a);
        a.click();
        a.remove();
        // revoke after a short delay to ensure download started
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
        // Fallback: open in new tab so user can manually save
        try {
            window.open(url, "_blank", "noopener,noreferrer");
        } catch (e) {
            console.error("Failed to download or open media:", e);
        }
    }
};
