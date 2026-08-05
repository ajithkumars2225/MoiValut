using Microsoft.EntityFrameworkCore;
using MoiBackend.Core.DTOs;
using MoiBackend.Core.Entities;
using MoiBackend.Core.Interfaces;
using MoiBackend.Infrastructure.Data;

namespace MoiBackend.Infrastructure.Services;

public class MoiService : IMoiService
{
    private readonly MoiDbContext _dbContext;

    public MoiService(MoiDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Event>> GetAllEventsAsync()
    {
        return await _dbContext.Events.AsNoTracking().ToListAsync();
    }

    public async Task<Event> CreateEventAsync(Event eventEntity)
    {
        _dbContext.Events.Add(eventEntity);
        await _dbContext.SaveChangesAsync();
        return eventEntity;
    }

    public async Task<Event> UpdateEventAsync(long id, Event eventEntity)
    {
        var existing = await _dbContext.Events.FindAsync(id)
            ?? throw new InvalidOperationException("Event not found");

        existing.Name = eventEntity.Name;
        existing.EventDate = eventEntity.EventDate;
        existing.Location = eventEntity.Location;
        existing.InvitationImage = eventEntity.InvitationImage;

        await _dbContext.SaveChangesAsync();
        return existing;
    }

    public async Task DeleteEventAsync(long eventId)
    {
        var evt = await _dbContext.Events.FindAsync(eventId);
        if (evt != null)
        {
            _dbContext.Events.Remove(evt);
            await _dbContext.SaveChangesAsync();
        }
    }

    public async Task<MoiResponse> RecordMoiAsync(MoiRequest request)
    {
        var evt = await _dbContext.Events.FindAsync(request.EventId)
            ?? throw new InvalidOperationException("Event not found");

        var contributor = await _dbContext.Contributors
            .FirstOrDefaultAsync(c => c.Name == request.ContributorName && c.Village == request.Village);

        if (contributor == null)
        {
            contributor = new Contributor
            {
                Name = request.ContributorName,
                Village = request.Village
            };
            _dbContext.Contributors.Add(contributor);
            await _dbContext.SaveChangesAsync();
        }

        var transaction = new MoiTransaction
        {
            Amount = request.Amount,
            GiftTerm = request.GiftTerm,
            ReturnAmount = request.ReturnAmount,
            TransactionDate = DateTime.UtcNow,
            EventId = evt.Id,
            ContributorId = contributor.Id
        };

        _dbContext.MoiTransactions.Add(transaction);
        await _dbContext.SaveChangesAsync();

        var serialNo = await _dbContext.MoiTransactions
            .Where(t => t.EventId == evt.Id && t.Id <= transaction.Id)
            .CountAsync();

        return new MoiResponse
        {
            TransactionId = transaction.Id,
            SerialNumber = serialNo,
            ContributorName = contributor.Name,
            Village = contributor.Village ?? string.Empty,
            Amount = transaction.Amount,
            GiftTerm = transaction.GiftTerm,
            ReturnAmount = transaction.ReturnAmount,
            TransactionDate = transaction.TransactionDate,
            EventId = evt.Id
        };
    }

    public async Task<MoiResponse> UpdateMoiAsync(long transactionId, MoiRequest request)
    {
        var tx = await _dbContext.MoiTransactions
            .Include(t => t.Contributor)
            .FirstOrDefaultAsync(t => t.Id == transactionId)
            ?? throw new InvalidOperationException("Transaction not found");

        tx.Contributor.Name = request.ContributorName;
        tx.Contributor.Village = request.Village;
        tx.Amount = request.Amount;
        tx.GiftTerm = request.GiftTerm;
        tx.ReturnAmount = request.ReturnAmount;

        await _dbContext.SaveChangesAsync();

        var serialNo = await _dbContext.MoiTransactions
            .Where(t => t.EventId == tx.EventId && t.Id <= tx.Id)
            .CountAsync();

        return new MoiResponse
        {
            TransactionId = tx.Id,
            SerialNumber = serialNo,
            ContributorName = tx.Contributor.Name,
            Village = tx.Contributor.Village ?? string.Empty,
            Amount = tx.Amount,
            GiftTerm = tx.GiftTerm,
            ReturnAmount = tx.ReturnAmount,
            TransactionDate = tx.TransactionDate,
            EventId = tx.EventId
        };
    }

    public async Task DeleteMoiAsync(long transactionId)
    {
        var tx = await _dbContext.MoiTransactions.FindAsync(transactionId);
        if (tx != null)
        {
            _dbContext.MoiTransactions.Remove(tx);
            await _dbContext.SaveChangesAsync();
        }
    }

    public async Task<List<MoiResponse>> GetTransactionsByEventAsync(long eventId)
    {
        var list = await _dbContext.MoiTransactions
            .AsNoTracking()
            .Where(t => t.EventId == eventId)
            .Include(t => t.Contributor)
            .OrderBy(t => t.Id)
            .ToListAsync();

        long serialNo = 1;
        return list.Select(tx => new MoiResponse
        {
            TransactionId = tx.Id,
            SerialNumber = serialNo++,
            ContributorName = tx.Contributor.Name,
            Village = tx.Contributor.Village ?? string.Empty,
            Amount = tx.Amount,
            GiftTerm = tx.GiftTerm,
            ReturnAmount = tx.ReturnAmount,
            TransactionDate = tx.TransactionDate,
            EventId = tx.EventId
        }).ToList();
    }

    public async Task<List<MoiResponse>> GetAllTransactionsAsync()
    {
        var list = await _dbContext.MoiTransactions
            .AsNoTracking()
            .Include(t => t.Contributor)
            .OrderBy(t => t.Id)
            .ToListAsync();

        return list.Select(tx => new MoiResponse
        {
            TransactionId = tx.Id,
            SerialNumber = tx.Id,
            ContributorName = tx.Contributor.Name,
            Village = tx.Contributor.Village ?? string.Empty,
            Amount = tx.Amount,
            GiftTerm = tx.GiftTerm,
            ReturnAmount = tx.ReturnAmount,
            TransactionDate = tx.TransactionDate,
            EventId = tx.EventId
        }).ToList();
    }

    public async Task<List<string>> GetAllVillagesAsync()
    {
        return await _dbContext.Contributors
            .AsNoTracking()
            .Where(c => !string.IsNullOrEmpty(c.Village))
            .Select(c => c.Village!)
            .Distinct()
            .OrderBy(v => v)
            .ToListAsync();
    }
}
