package ai.erythro;

public enum A44Tier {
    PRO("pro", 10),
    DIAGNOSTIC("diagnostic", 5),
    FREE("free", 1);

    public final String folder;
    public final int pageCap;

    A44Tier(String folder, int pageCap) {
        this.folder = folder;
        this.pageCap = pageCap;
    }
}
