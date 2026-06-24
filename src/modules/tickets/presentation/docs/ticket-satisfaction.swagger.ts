/**
 * @swagger
 * /tickets/{ticketId}/satisfaction:
 *   post:
 *     summary: Enviar pesquisa de satisfação (CSAT)
 *     description: |
 *       Permite que o cliente avalie um chamado resolvido ou fechado.
 *       Cada chamado aceita apenas uma avaliação (nota de 1 a 5).
 *     tags: [Tickets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubmitTicketSatisfactionInput'
 *           example:
 *             rating: 5
 *             comment: Atendimento excelente e resolução rápida.
 *     responses:
 *       201:
 *         description: Avaliação registrada
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/TicketSatisfactionSurvey'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         description: Chamado já avaliado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */

export {};
