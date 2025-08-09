import { Router } from "express";
import { jwtAuth, AuthenticatedRequest } from "../../middleware/jwtAuth";
import { enhancedTenantValidator } from "../../middleware/tenantValidator";
import { DrizzlePersonRepository } from "./infrastructure/repositories/DrizzlePersonRepository";
import { db } from "../../db";
import { SearchPeopleUseCase } from './application/use-cases/SearchPeopleUseCase';
import { PersonController } from './application/controllers/PersonController';

const peopleRouter = Router();

// Middleware de autenticação para todas as rotas
peopleRouter.use(jwtAuth);
peopleRouter.use(enhancedTenantValidator());

// Inicializar dependências
const personRepository = new DrizzlePersonRepository(db);
const searchPeopleUseCase = new SearchPeopleUseCase(personRepository);
const personController = new PersonController(searchPeopleUseCase);

// Basic CRUD endpoints
peopleRouter.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const people = await personRepository.findByTenant(tenantId);
    res.json(people);
  } catch (error) {
    console.error("Error fetching people:", error);
    res.status(500).json({ message: "Failed to fetch people" });
  }
});

// Search people (users and customers) with unified results
peopleRouter.get('/search', personController.search.bind(personController));

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