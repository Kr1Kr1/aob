import 'server-only';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// User Functions
export async function getUserById(userId: string) {
  try {
    return await prisma.iAUser.findUnique({
      where: { id: userId },
    });
  } catch (error) {
    console.error('Failed to get user by ID:', error);
    throw error;
  }
}

export async function createUser({ username }: { username: string }) {
  try {
    return await prisma.iAUser.create({
      data: {
        username,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to create user in database:', error);
    throw error;
  }
}

// Chat Functions
export async function getChatById(id: string) {
    try {
      return await prisma.iAChat.findUnique({
        where: { id },
        include: {
          // Include related data if needed, e.g., messages, votes, etc.
          messages: true,
          votes: true,
        },
      });
    } catch (error) {
      console.error('Failed to get chat by ID:', error);
      throw error;
    }
}

export async function saveChat({
  id,
  characterId,
  chatType,
}: {
  id: string;
  characterId: number;
  chatType: string;
}) {
  try {
    return await prisma.iAChat.create({
      data: {
        id,
        createdAt: new Date(),
        characterId,
        chatType,
      },
    });
  } catch (error) {
    console.error('Failed to save chat:', error);
    throw error;
  }
}

export async function deleteChatById(id: string) {
  try {
    await prisma.iAVote.deleteMany({
      where: { chatId: id },
    });

    await prisma.iAMessage.deleteMany({
      where: { chatId: id },
    });

    return await prisma.iAChat.delete({
      where: { id },
    });
  } catch (error) {
    console.error('Failed to delete chat:', error);
    throw error;
  }
}

// Message Functions
export async function saveMessages(messages: Array<{ chatId: string; content: string; role: string }>) {
  try {
    return await prisma.iAMessage.createMany({
      data: messages,
    });
  } catch (error) {
    console.error('Failed to save messages:', error);
    throw error;
  }
}

export async function getMessagesByChatId(chatId: string) {
  try {
    return await prisma.iAMessage.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    });
  } catch (error) {
    console.error('Failed to get messages by chat ID:', error);
    throw error;
  }
}

// Voting Functions
export async function voteMessage(chatId: string, messageId: string, type: 'up' | 'down') {
  try {
    const existingVote = await prisma.iAVote.findFirst({
      where: { chatId, messageId },
    });

    if (existingVote) {
      return await prisma.iAVote.update({
        where: { chatId_messageId: { chatId, messageId } },
        data: { isUpvoted: type === 'up' },
      });
    }

    return await prisma.iAVote.create({
      data: {
        chatId,
        messageId,
        isUpvoted: type === 'up',
      },
    });
  } catch (error) {
    console.error('Failed to vote message:', error);
    throw error;
  }
}

// Document Functions
export async function saveDocument({
  id,
  title,
  content,
  userId,
}: {
  id: string;
  title: string;
  content?: string;
  userId: string;
}) {
  try {
    return await prisma.iADocument.create({
      data: {
        id,
        title,
        content,
        userId,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to save document:', error);
    throw error;
  }
}

export async function getDocumentsById(id: string) {
  try {
    return await prisma.iADocument.findMany({
      where: { id },
      orderBy: { createdAt: 'asc' },
    });
  } catch (error) {
    console.error('Failed to get documents by ID:', error);
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await prisma.iASuggestion.deleteMany({
      where: {
        documentId: id,
        createdAt: { gt: timestamp },
      },
    });

    return await prisma.iADocument.deleteMany({
      where: {
        id,
        createdAt: { gt: timestamp },
      },
    });
  } catch (error) {
    console.error('Failed to delete documents:', error);
    throw error;
  }
}

// Suggestion Functions
export async function saveSuggestions(suggestions: Array<{ id: string; documentId: string; suggestedText: string }>) {
  try {
    return await prisma.iASuggestion.createMany({
      data: suggestions,
    });
  } catch (error) {
    console.error('Failed to save suggestions:', error);
    throw error;
  }
}

export async function getSuggestionsByDocumentId(documentId: string) {
  try {
    return await prisma.iASuggestion.findMany({
      where: { documentId },
    });
  } catch (error) {
    console.error('Failed to get suggestions by document ID:', error);
    throw error;
  }
}

export async function updateChatVisibilityById({
    chatId,
    visibility,
  }: {
    chatId: string;
    visibility: 'private' | 'public';
  }) {
    try {
      return await prisma.iAChat.update({
        where: { id: chatId },
        data: { visibility },
      });
    } catch (error) {
      console.error('Failed to update chat visibility in database:', error);
      throw error;
    }
}
