// People Search API Routes - Unified person search
import { Router } from "express";
import { jwtAuth, AuthenticatedRequest } from "../../middleware/jwtAuth";
import { DrizzlePersonRepository } from "../shared/infrastructure/DrizzlePersonRepository";

const peopleRouter = Router();
const personRepository = new DrizzlePersonRepository();

// Search people (users and customers) with unified results
peopleRouter.get('/search', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const query = req.query.q as string;
    const typesParam = req.query.types as string;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const types = typesParam ? typesParam.split(',') as ('user' | 'customer')[] : ['user', 'customer'];
    const limit = parseInt(req.query.limit as string) || 20;

    const people = await personRepository.searchPeople(query, req.user.tenantId, {
      types,
      limit
    });

    res.json(people);
  } catch (error) {
    console.error("Error searching people:", error);
    res.status(500).json({ message: "Failed to search people" });
  }
});

// Get person by ID and type
peopleRouter.get('/:type/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const { type, id } = req.params;
    
    if (!['user', 'customer'].includes(type)) {
      return res.status(400).json({ message: "Invalid person type" });
    }

    const person = await personRepository.findPersonById(id, type as 'user' | 'customer', req.user.tenantId);
    
    if (!person) {
      return res.status(404).json({ message: "Person not found" });
    }

    res.json(person);
  } catch (error) {
    console.error("Error fetching person:", error);
    res.status(500).json({ message: "Failed to fetch person" });
  }
});

export { peopleRouter };