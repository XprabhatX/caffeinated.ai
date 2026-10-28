import { z } from 'zod';
import { Topic } from '../models/topic.model.js';
import { Folder } from '../models/folder.model.js';

const verifyFolderOwnership = async (folderId, userId) => {
    return await Folder.findOne({
        _id: folderId,
        userId
    });
};

const verifyTopicOwnership = async (topicId, userId) => {
    const topic = await Topic.findOne({
        _id: topicId
    });

    if (!topic) {
        return null;
    }

    const folder = await Folder.findOne({
        _id: topic.folderId,
        userId
    });

    if (!folder) {
        return null;
    }

    return topic;
};

const serializeTopic = (topic) => ({
    id: topic._id.toString(),
    name: topic.name,
    description: topic.description || ''
});

export const registerTopicTools = (server, user) => {
    const userId = user.id;

    server.tool(
        'get_topics',
        'Get all topics in a folder. Returns lightweight topic information without notes.',
        {
            folderId: z.string()
        },
        async ({ folderId }) => {
            const folder = await verifyFolderOwnership(
                folderId,
                userId
            );

            if (!folder) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Folder not found.'
                        }
                    ],
                    isError: true
                };
            }

            const topics = await Topic.find({
                folderId
            })
                .select('_id name description')
                .sort({ createdAt: 1 })
                .lean();

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(
                            topics.map(serializeTopic)
                        )
                    }
                ]
            };
        }
    );

    server.tool(
        'search_topics',
        'Search topics within a folder by keyword. Searches topic names and descriptions. Does not return notes.',
        {
            folderId: z.string(),
            query: z.string()
        },
        async ({ folderId, query }) => {
            const folder = await verifyFolderOwnership(
                folderId,
                userId
            );

            if (!folder) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Folder not found.'
                        }
                    ],
                    isError: true
                };
            }

            const search = query.trim();

            if (!search) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Search query cannot be empty.'
                        }
                    ],
                    isError: true
                };
            }

            const topics = await Topic.find({
                folderId,
                $or: [
                    {
                        name: {
                            $regex: search,
                            $options: 'i'
                        }
                    },
                    {
                        description: {
                            $regex: search,
                            $options: 'i'
                        }
                    }
                ]
            })
                .select('_id name description')
                .sort({ createdAt: 1 })
                .lean();

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(
                            topics.map(serializeTopic)
                        )
                    }
                ]
            };
        }
    );

    server.tool(
        'get_topic',
        'Get a topic by ID, including its complete notes.',
        {
            topicId: z.string()
        },
        async ({ topicId }) => {
            const topic = await verifyTopicOwnership(
                topicId,
                userId
            );

            if (!topic) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Topic not found.'
                        }
                    ],
                    isError: true
                };
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            id: topic._id.toString(),
                            name: topic.name,
                            description: topic.description || '',
                            notes: topic.notes || '',
                            folderId: topic.folderId.toString()
                        })
                    }
                ]
            };
        }
    );

    server.tool(
        'create_topic',
        'Create a new topic inside a folder.',
        {
            folderId: z.string(),
            name: z.string(),
            description: z.string().optional()
        },
        async ({
            folderId,
            name,
            description
        }) => {
            const folder = await verifyFolderOwnership(
                folderId,
                userId
            );

            if (!folder) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Folder not found.'
                        }
                    ],
                    isError: true
                };
            }

            const topic = await Topic.create({
                name,
                description: description || '',
                folderId,
                notes: '',
                context: {}
            });

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            id: topic._id.toString(),
                            name: topic.name,
                            description: topic.description || ''
                        })
                    }
                ]
            };
        }
    );

    server.tool(
        'delete_topic',
        'Delete a topic belonging to the current user.',
        {
            topicId: z.string()
        },
        async ({ topicId }) => {
            const topic = await verifyTopicOwnership(
                topicId,
                userId
            );

            if (!topic) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Topic not found.'
                        }
                    ],
                    isError: true
                };
            }

            await Topic.deleteOne({
                _id: topicId
            });

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            topicId
                        })
                    }
                ]
            };
        }
    );

    server.tool(
        'update_topic',
        'Update the name or description of a topic.',
        {
            topicId: z.string(),
            name: z.string().optional(),
            description: z.string().optional()
        },
        async ({
            topicId,
            name,
            description
        }) => {
            const topic = await verifyTopicOwnership(
                topicId,
                userId
            );

            if (!topic) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Topic not found.'
                        }
                    ],
                    isError: true
                };
            }

            const updates = {};

            if (name !== undefined) {
                updates.name = name;
            }

            if (description !== undefined) {
                updates.description = description;
            }

            const updatedTopic = await Topic.findOneAndUpdate(
                {
                    _id: topicId
                },
                {
                    $set: updates
                },
                {
                    new: true
                }
            ).lean();

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            id: updatedTopic._id.toString(),
                            name: updatedTopic.name,
                            description:
                                updatedTopic.description || ''
                        })
                    }
                ]
            };
        }
    );

    server.tool(
        'add_topic_notes',
        `Append Markdown notes to an existing topic.

RULES — ALL ARE STRICT AND MUST BE FOLLOWED:

1. CHARACTER LIMIT
- The notes string MUST contain 15000 characters or fewer.
- Count every character, including spaces, punctuation, Markdown syntax,
  Mermaid syntax, and newlines.

2. MARKDOWN
- notes MUST be plain Markdown.
- Do NOT return JSON.
- Do NOT return HTML.
- Do NOT wrap the entire response in a code fence.
- Mermaid is allowed ONLY inside a fenced Markdown block:

\`\`\`mermaid
flowchart TD
    A[Input] --> B[Output]
\`\`\`

3. MERMAID DIAGRAM TYPE
- Mermaid diagrams MUST use ONLY:
    flowchart TD
    flowchart LR
- NEVER use graph TD or graph LR.
- NEVER use sequenceDiagram, classDiagram, stateDiagram, erDiagram,
  journey, timeline, mindmap, gitGraph, or any other Mermaid diagram type.

4. MERMAID FLOWCHART ONLY
- Use ordinary flowchart nodes and arrows only.
- NEVER use sequence-diagram constructs.
- NEVER use:
    loop
    alt
    opt
    par
    critical
    participant
    activate
    deactivate
- Represent repeated processes using ordinary flowchart nodes and arrows.

5. NODE IDS
- Node IDs MUST contain ONLY ASCII letters, numbers, and underscores.
- Node IDs MUST NOT contain spaces.
- Node IDs MUST NOT contain hyphens, dots, brackets, braces,
  parentheses, slashes, mathematical notation, or Unicode characters.

VALID:
    Input_Image
    Noise_Model
    Output1

INVALID:
    input-image
    Input Image
    x_{t-1}
    node.one

6. NODE LABELS — EXTREMELY RESTRICTED
- Every node MUST use this format:

    ID[Label]

  or:

    ID{Label}

- The Label MUST contain ONLY:
    ASCII letters A-Z
    ASCII letters a-z
    numbers 0-9
    spaces

- NO punctuation or symbols are allowed inside node labels.
- Do NOT use:
    parentheses
    brackets
    braces
    commas
    periods
    colons
    semicolons
    slashes
    backslashes
    hyphens
    underscores
    @
    #
    $
    %
    &
    =
    +
    -
    *
    /
    <
    >
    ^
    |
    Unicode characters
    Greek letters
    arrows
    mathematical operators
    LaTeX
    subscripts
    superscripts

VALID:
    AUC Score
    High AUC
    True Positive Rate
    Predict Noise
    Previous Latent

INVALID:
    AUC = Area Under Curve
    High AUC > 0.9
    TPR@threshold
    x_{t-1}
    Q • K
    ε theta

IMPORTANT:
- Convert technical notation into plain words.
- For example:
    "AUC > 0.9" becomes "AUC Above 0 Point 9"
    "x_{t-1}" becomes "Previous Latent"
    "Q • K transpose" becomes "Q Times K Transpose"

7. EDGE SYNTAX
- ONLY use these forms:

    A --> B
    A -.-> B
    A -->|Label| B
    A -.->|Label| B

- Always put spaces around arrows.

VALID:
    A --> B
    A -->|Predict Noise| B

INVALID:
    A-->B
    A -->|Predict Noise|B
    A<-B
    A => B

8. EDGE LABELS — EXTREMELY RESTRICTED
- Edge labels MUST contain ONLY ASCII letters, numbers, and spaces.
- No punctuation or symbols.
- Do NOT use mathematical notation or Unicode.
- Keep edge labels short.

VALID:
    A -->|Threshold Decreases| B

INVALID:
    A -->|Threshold decreases >| B
    A -->|TPR @ threshold| B
    A -->|Add Noise t equals T| B

9. SUBGRAPHS
- Subgraphs MAY be used.
- Use ONLY:

    subgraph Name
        A[Node A] --> B[Node B]
    end

- Subgraph names MUST contain ONLY ASCII letters, numbers, and
  underscores.
- Do NOT use quoted subgraph titles.
- Every subgraph MUST have exactly one matching end.
- Do NOT put flow-control constructs inside subgraphs.

10. NO SPECIAL CHARACTERS IN MERMAID
- Treat Mermaid as ASCII-only.
- The following characters are FORBIDDEN anywhere inside a Mermaid block
  except the required Markdown fence itself:

    < > ( ) { } = @ # $ % & + * / \\\\ : ; , ' " \` ^ | ~

- Do NOT use Unicode symbols.
- Do NOT use Greek letters.
- Do NOT use mathematical operators.
- Do NOT use LaTeX.
- Do NOT use emoji.

11. NO IMPLIED NODES
- Every node MUST have an explicit ID.
- Never write a multi-word node directly as an edge target.

VALID:
    Decoder[VAE Decoder]
    Decoder --> Output[Generated Image]

INVALID:
    G --> VAE Decoder

12. VALIDATION BEFORE RETURNING
Before returning the notes, check EVERY Mermaid block:

- First line is exactly flowchart TD or flowchart LR.
- Every node ID uses only letters numbers underscores.
- Every node has an explicit label.
- Every node label contains only letters numbers spaces.
- Every edge uses --> or -.->.
- Every edge label contains only letters numbers spaces.
- Every subgraph has a matching end.
- No sequence-diagram syntax exists.
- No Unicode exists.
- No mathematical symbols exist.
- No punctuation exists inside Mermaid labels.
- No Mermaid syntax appears outside the mermaid fence.
- The Mermaid block ends with \`\`\`.

13. FALLBACK
- A simple valid diagram is ALWAYS better than a sophisticated invalid
  diagram.
- If a concept requires mathematical notation, special characters,
  equations, or complex Mermaid syntax, simplify the wording.
- If the concept cannot be represented safely, DO NOT create a Mermaid
  diagram. Explain it using normal Markdown instead.

14. CONTENT
- Keep notes concise and useful.
- Do not mention these rules.
- Do not mention Mermaid validation.
- Do not include tool instructions in the notes.

This tool APPENDS notes to the existing topic notes.
It does NOT replace existing notes.

The final notes value must be directly storable as a MongoDB string
and must render correctly through ReactMarkdown and the application's
Mermaid renderer.
`,
        {
            topicId: z.string(),
            notes: z.string()
        },
        async ({ topicId, notes }) => {
            console.log(topicId, notes);

            const topic = await verifyTopicOwnership(
                topicId,
                userId
            );

            if (!topic) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Topic not found.'
                        }
                    ],
                    isError: true
                };
            }

            if (!notes.trim()) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Notes cannot be empty.'
                        }
                    ],
                    isError: true
                };
            }

            const existingNotes = topic.notes || '';

            // Keep the notes as a normal MongoDB string.
            // Add a blank line between existing and new content.
            const updatedNotes = existingNotes
                ? `${existingNotes}\n\n${notes}`
                : notes;

            topic.notes = updatedNotes;
            await topic.save();

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            topicId: topic._id.toString(),
                            notes: topic.notes
                        })
                    }
                ]
            };
        }
    );

    server.tool(
        'update_ui',
        `Crucial last tool to call if following 4 changes are made:
1. created a topic
2. deleted a topic
3. updated topic name or description
4. added or updated topic notes
or
5. you want to close the currently open topic in ui
6. you want to close a topic with certain id if it is open (send topicId if true)
7. you want to open a topic in ui (send topicId if true)
8. you want to refresh the certain topic (with a topicId) content if it is open in ui since you made changes to it (send topicId if true)
`,
        {
            createdOrUpdatedTopic: z.boolean(),
            updatedTopicNameOrDescription: z.boolean(),
            addedOrUpdatedTopicNotes: z.boolean(),
            shouldCloseCurrentTopic: z.boolean(),
            shouldCloseTopicWithIdIfOpenInUI: z.boolean(),
            shouldOpenTopicWithID: z.boolean(),
            shouldRefreshTopicWithIdIfOpenInUI: z.boolean(),
            topicId: z.string(),
        },
        async ({
                createdOrUpdatedTopic,
                updatedTopicNameOrDescription,
                addedOrUpdatedTopicNotes,
                shouldCloseCurrentTopic,
                shouldCloseTopicWithIdIfOpenInUI,
                shouldOpenTopicWithID,
                shouldRefreshTopicWithIdIfOpenInUI,
                topicId
            }) => {

            let uiUpdates = {
                refresh_left_panel_current_folder: false,
                refresh_current_topic_content: false,
                open_topic_with_id: false,
                close_topic_if_id: false,
                close_current_topic: false,
                refresh_topic_if_id: false
            }

            if (
                createdOrUpdatedTopic || 
                updatedTopicNameOrDescription ||
                addedOrUpdatedTopicNotes
            ) {
                uiUpdates.refresh_left_panel_current_folder = true;
            }
            if (addedOrUpdatedTopicNotes) {
                uiUpdates.refresh_current_topic_content = true;
            }
            uiUpdates.close_current_topic = shouldCloseCurrentTopic;
            uiUpdates.close_topic_if_id = shouldCloseTopicWithIdIfOpenInUI;
            uiUpdates.open_topic_with_id = shouldOpenTopicWithID;
            uiUpdates.refresh_topic_if_id = shouldRefreshTopicWithIdIfOpenInUI;

            if (
                (
                    uiUpdates.open_topic_with_id || 
                    uiUpdates.close_topic_if_id ||
                    uiUpdates.refresh_topic_if_id
                ) &&
                 !topicId) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Topic id was not found for the required ui update.'
                        }
                    ],
                    isError: true
                };
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            topicId,
                            uiUpdates
                        })
                    }
                ]
            };
        }
    );
};