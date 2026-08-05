using Microsoft.EntityFrameworkCore;
using MoiBackend.Core.Entities;

namespace MoiBackend.Infrastructure.Data;

public class MoiDbContext : DbContext
{
    public MoiDbContext(DbContextOptions<MoiDbContext> options) : base(options)
    {
    }

    public DbSet<Event> Events => Set<Event>();
    public DbSet<Contributor> Contributors => Set<Contributor>();
    public DbSet<MoiTransaction> MoiTransactions => Set<MoiTransaction>();
    public DbSet<GoldEntry> GoldEntries => Set<GoldEntry>();
    public DbSet<GivenMoiEntry> GivenMoiEntries => Set<GivenMoiEntry>();
    public DbSet<ConflictRecord> ConflictRecords => Set<ConflictRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Event>(entity =>
        {
            entity.ToTable("events");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name).HasColumnName("name").IsRequired();
            entity.Property(e => e.EventDate).HasColumnName("event_date");
            entity.Property(e => e.Location).HasColumnName("location");
            entity.Property(e => e.InvitationImage).HasColumnName("invitation_image");
        });

        modelBuilder.Entity<Contributor>(entity =>
        {
            entity.ToTable("contributors");
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Id).HasColumnName("id");
            entity.Property(c => c.Name).HasColumnName("name").IsRequired();
            entity.Property(c => c.Village).HasColumnName("village");

            entity.HasIndex(c => new { c.Name, c.Village }).IsUnique(false);
        });

        modelBuilder.Entity<MoiTransaction>(entity =>
        {
            entity.ToTable("moi_transactions");
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Id).HasColumnName("id");
            entity.Property(t => t.Amount).HasColumnName("amount").HasColumnType("decimal(19, 2)").IsRequired();
            entity.Property(t => t.TransactionDate).HasColumnName("transaction_date");
            entity.Property(t => t.GiftTerm).HasColumnName("gift_term");
            entity.Property(t => t.ReturnAmount).HasColumnName("return_amount").HasColumnType("decimal(19, 2)");
            entity.Property(t => t.EventId).HasColumnName("event_id");
            entity.Property(t => t.ContributorId).HasColumnName("contributor_id");

            entity.HasOne(t => t.Event)
                .WithMany(e => e.MoiTransactions)
                .HasForeignKey(t => t.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(t => t.Contributor)
                .WithMany(c => c.MoiTransactions)
                .HasForeignKey(t => t.ContributorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<GoldEntry>(entity =>
        {
            entity.ToTable("gold_entries");
            entity.HasKey(g => g.Id);
            entity.Property(g => g.Id).HasColumnName("id");
            entity.Property(g => g.GoldDetails).HasColumnName("gold_details").IsRequired();
            entity.Property(g => g.EntryDate).HasColumnName("entry_date");
            entity.Property(g => g.EventId).HasColumnName("event_id");
            entity.Property(g => g.ContributorId).HasColumnName("contributor_id");

            entity.HasOne(g => g.Event)
                .WithMany(e => e.GoldEntries)
                .HasForeignKey(g => g.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(g => g.Contributor)
                .WithMany(c => c.GoldEntries)
                .HasForeignKey(g => g.ContributorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<GivenMoiEntry>(entity =>
        {
            entity.ToTable("given_moi_entries");
            entity.HasKey(gm => gm.Id);
            entity.Property(gm => gm.Id).HasColumnName("id");
            entity.Property(gm => gm.RecipientName).HasColumnName("recipient_name").IsRequired();
            entity.Property(gm => gm.Village).HasColumnName("village");
            entity.Property(gm => gm.Amount).HasColumnName("amount").HasColumnType("decimal(19, 2)").IsRequired();
            entity.Property(gm => gm.GiftType).HasColumnName("gift_type");
            entity.Property(gm => gm.GoldDetails).HasColumnName("gold_details");
            entity.Property(gm => gm.Occasion).HasColumnName("occasion");
            entity.Property(gm => gm.GiftTerm).HasColumnName("gift_term");
            entity.Property(gm => gm.GivenDate).HasColumnName("given_date");
            entity.Property(gm => gm.Notes).HasColumnName("notes");
            entity.Property(gm => gm.EventId).HasColumnName("event_id");

            entity.HasOne(gm => gm.Event)
                .WithMany()
                .HasForeignKey(gm => gm.EventId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ConflictRecord>(entity =>
        {
            entity.ToTable("conflict_records");
            entity.HasKey(cr => cr.Id);
            entity.Property(cr => cr.Id).HasColumnName("id");
            entity.Property(cr => cr.RecipientName).HasColumnName("recipient_name").IsRequired();
            entity.Property(cr => cr.Village).HasColumnName("village");
            entity.Property(cr => cr.OurGivenAmount).HasColumnName("our_given_amount").HasColumnType("decimal(19, 2)");
            entity.Property(cr => cr.TheirTotalGiftAmount).HasColumnName("their_total_gift_amount").HasColumnType("decimal(19, 2)");
            entity.Property(cr => cr.ConflictStatus).HasColumnName("conflict_status");
            entity.Property(cr => cr.ConflictNote).HasColumnName("conflict_note");
            entity.Property(cr => cr.GivenMoiEntryId).HasColumnName("given_moi_entry_id");
            entity.Property(cr => cr.EventId).HasColumnName("event_id");
            entity.Property(cr => cr.CheckedAt).HasColumnName("checked_at");

            entity.HasOne(cr => cr.Event)
                .WithMany()
                .HasForeignKey(cr => cr.EventId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
